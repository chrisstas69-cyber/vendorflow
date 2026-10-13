import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';
import { eventToken, sendEventEmail, slugifyEvent, type PublicEventInput } from '@/lib/public-events';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  try {
    const [submissions, claims, corrections] = await Promise.all([
      prisma.eventSubmission.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' }, take: 100 }),
      prisma.eventClaim.findMany({ where: { status: 'pending' }, include: { listing: true }, orderBy: { createdAt: 'asc' }, take: 100 }),
      prisma.eventCorrection.findMany({ where: { status: 'open' }, include: { listing: true }, orderBy: { createdAt: 'asc' }, take: 100 }),
    ]);
    return NextResponse.json({ ok: true, submissions: submissions.map(row => ({ ...row, payload: JSON.parse(row.payloadJson) })), claims, corrections });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Moderation queue unavailable.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req); if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    if (body.entity === 'submission') {
      const submission = await prisma.eventSubmission.findUnique({ where: { id: body.id } });
      if (!submission) return NextResponse.json({ ok: false, error: 'Submission not found.' }, { status: 404 });
      if (body.action === 'reject') {
        await prisma.eventSubmission.update({ where: { id: submission.id }, data: { status: 'rejected', moderationNote: body.note } });
        return NextResponse.json({ ok: true });
      }
      const input = JSON.parse(submission.payloadJson) as PublicEventInput;
      const baseSlug = `${slugifyEvent(input.name)}-${input.startDate}`;
      let slug = baseSlug; let suffix = 2;
      while (await prisma.publicEventListing.findUnique({ where: { slug } })) slug = `${baseSlug}-${suffix++}`;
      const manageToken = eventToken();
      const listing = await prisma.publicEventListing.create({
        data: {
          slug, name: input.name.trim(), startDate: new Date(`${input.startDate}T12:00:00Z`), endDate: input.endDate ? new Date(`${input.endDate}T12:00:00Z`) : null,
          timeLabel: input.timeLabel, venueName: input.venueName.trim(), streetAddress: input.streetAddress, city: input.city.trim(), state: input.state,
          postalCode: input.postalCode, description: input.description, category: input.category, imageUrl: input.imageUrl,
          organizerName: input.organizerName, organizerEmail: input.email.toLowerCase().trim(), sourceName: 'Organizer submission', sourceUrl: input.sourceUrl,
          vendorApplicationUrl: input.vendorApplicationUrl, vendorDeadline: input.vendorDeadline ? new Date(`${input.vendorDeadline}T12:00:00Z`) : null,
          boothFeeCents: Number.isFinite(input.boothFee) ? Math.round(Number(input.boothFee) * 100) : null,
          vendorDetails: JSON.stringify({ notes: input.vendorDetails ?? '' }), status: 'published', trustStatus: 'organizer_verified',
          lastVerifiedAt: new Date(), publishedAt: new Date(), expiresAt: new Date(new Date(`${input.endDate || input.startDate}T23:59:59Z`).getTime() + 14 * 86400000),
          manageToken, submissionId: submission.id,
        },
      });
      await prisma.eventSubmission.update({ where: { id: submission.id }, data: { status: 'approved', listingId: listing.id, moderationNote: body.note } });
      const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'}/manage-event/${manageToken}`;
      await sendEventEmail(submission.email, `${input.name} is live on VendorFlow`, `<p>Your event is published.</p><p><a href="${manageUrl}">Manage or update this event</a></p>`).catch(() => false);
      return NextResponse.json({ ok: true, listing, manageUrl });
    }
    if (body.entity === 'claim') {
      const claim = await prisma.eventClaim.update({ where: { id: body.id }, data: { status: body.action === 'approve' ? 'approved' : 'rejected' } });
      if (body.action === 'approve' && claim.listingId) await prisma.publicEventListing.update({ where: { id: claim.listingId }, data: { claimedByEmail: claim.email, trustStatus: 'organizer_verified', lastVerifiedAt: new Date(), manageToken: eventToken() } });
      return NextResponse.json({ ok: true });
    }
    if (body.entity === 'correction') {
      await prisma.eventCorrection.update({ where: { id: body.id }, data: { status: body.action === 'resolve' ? 'resolved' : 'dismissed' } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'Unsupported moderation action.' }, { status: 400 });
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Moderation failed.' }, { status: 500 }); }
}

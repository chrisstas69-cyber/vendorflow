import { NextRequest, NextResponse } from 'next/server';
import { listInvoices, serializeInvoice } from '@/lib/payments/payment-service';
import { getSessionFromRequest } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import {
  BOOTH_FEE_TEMPLATE_BODY,
  generateContractDocument,
  parseMilestones,
} from '@/lib/payments/contract-engine';

/** GET — list invoices. Vendors see only their own; organizer/demo can filter. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = getSessionFromRequest(req);
  const vendorEmail =
    session?.role === 'vendor'
      ? session.email
      : searchParams.get('vendorEmail') ?? undefined;
  const invoices = await listInvoices({
    organizerId: searchParams.get('organizerId') ?? undefined,
    vendorEmail,
    vendorPassportId: session?.role === 'vendor' ? undefined : searchParams.get('vendorPassportId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  });
  return NextResponse.json({ ok: true, invoices: invoices.map(serializeInvoice) });
}

/** POST — create invoice + optional contract from template */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizerId,
      vendorPassportId,
      eventId,
      lineItems,
      templateSlug = 'booth-fee-standard',
      vendorName,
      organizerName,
      eventName,
      eventDate,
    } = body;

    if (!organizerId || !vendorPassportId || !lineItems?.length) {
      return NextResponse.json(
        { ok: false, error: 'organizerId, vendorPassportId, lineItems required' },
        { status: 400 }
      );
    }

    const totalAmountCents = lineItems.reduce(
      (s: number, li: { amountCents: number; quantity?: number }) =>
        s + li.amountCents * (li.quantity ?? 1),
      0
    );

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: 'draft',
        organizerId,
        vendorPassportId,
        eventId,
        totalAmountCents,
        lineItems: {
          create: lineItems.map((li: { label: string; amountCents: number; quantity?: number }, i: number) => ({
            label: li.label,
            amountCents: li.amountCents,
            quantity: li.quantity ?? 1,
            sortOrder: i,
          })),
        },
        splits: {
          create: [
            { payeeType: 'organizer', payeeLabel: 'Organizer share', percentBps: 8500 },
            { payeeType: 'platform', payeeLabel: 'VendorFlow fee', percentBps: 1500 },
          ],
        },
      },
      include: { lineItems: true, splits: true, contracts: true, vendor: true },
    });

    let template = await prisma.contractTemplate.findUnique({ where: { slug: templateSlug } });
    if (!template) {
      template = await prisma.contractTemplate.create({
        data: {
          slug: templateSlug,
          name: 'Standard Booth Fee Agreement',
          bodyTemplate: BOOTH_FEE_TEMPLATE_BODY,
          defaultMilestones: JSON.stringify(parseMilestones('[]')),
        },
      });
    }

    const { documentBody, milestones } = generateContractDocument({
      templateBody: template.bodyTemplate,
      vendorName: vendorName ?? invoice.vendor?.businessName ?? 'Vendor',
      organizerName: organizerName ?? 'Organizer',
      eventName: eventName ?? 'Event',
      eventDate: eventDate ?? new Date().toISOString().slice(0, 10),
      totalAmountCents,
      milestones: parseMilestones(template.defaultMilestones),
    });

    await prisma.contract.create({
      data: {
        templateId: template.id,
        invoiceId: invoice.id,
        vendorPassportId,
        organizerId,
        eventId,
        status: 'draft',
        milestones: JSON.stringify(milestones),
        documentBody,
      },
    });

    const full = await listInvoices({ organizerId });
    const created = full.find(i => i.id === invoice.id);
    return NextResponse.json({ ok: true, invoice: created ? serializeInvoice(created) : invoice }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Create failed' },
      { status: 500 }
    );
  }
}

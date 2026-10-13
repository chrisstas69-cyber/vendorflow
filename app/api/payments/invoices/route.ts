import { NextRequest, NextResponse } from 'next/server';
import { listInvoices, serializeInvoice } from '@/lib/payments/payment-service';
import { organizerIdForRequest, requireSession } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import {
  BOOTH_FEE_TEMPLATE_BODY,
  generateContractDocument,
  parseMilestones,
} from '@/lib/payments/contract-engine';

/** GET — list invoices. Vendors see only their own; organizer/demo can filter. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth = requireSession(req); if (!auth.ok) return auth.response;
    const organizer = auth.session.role === 'organizer'
      ? await organizerIdForRequest(req)
      : null;
    if (organizer && !organizer.ok) return organizer.response;
    const invoices = await listInvoices({
      organizerId: organizer?.ok ? organizer.organizerId : undefined,
      vendorEmail: auth.session.role === 'vendor' ? auth.session.email : undefined,
      vendorPassportId: auth.session.role === 'organizer'
        ? searchParams.get('vendorPassportId') ?? undefined
        : undefined,
      status: searchParams.get('status') ?? undefined,
    });
    return NextResponse.json({ ok: true, invoices: invoices.map(serializeInvoice) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Invoice data is temporarily unavailable.' },
      { status: 503 }
    );
  }
}

/** POST — create invoice + optional contract from template */
export async function POST(req: NextRequest) {
  try {
    const auth = await organizerIdForRequest(req); if (!auth.ok) return auth.response;
    const body = await req.json();
    const {
      vendorPassportId,
      eventId,
      lineItems,
      templateSlug = 'booth-fee-standard',
      vendorName,
      organizerName,
      eventName,
      eventDate,
    } = body;
    const organizerId = auth.organizerId;

    if (!organizerId || !vendorPassportId || !lineItems?.length) {
      return NextResponse.json(
        { ok: false, error: 'organizerId, vendorPassportId, lineItems required' },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(lineItems) ||
      lineItems.length > 50 ||
      lineItems.some((item: { label?: unknown; amountCents?: unknown; quantity?: unknown }) =>
        typeof item.label !== 'string' || !item.label.trim() || item.label.length > 160 ||
        !Number.isInteger(item.amountCents) || Number(item.amountCents) < 0 || Number(item.amountCents) > 100_000_000 ||
        (item.quantity !== undefined && (!Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 100))
      )
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid invoice line items' }, { status: 400 });
    }
    const vendor = await prisma.vendorPassport.findUnique({ where: { id: vendorPassportId }, select: { id: true } });
    if (!vendor) return NextResponse.json({ ok: false, error: 'Vendor not found' }, { status: 404 });

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

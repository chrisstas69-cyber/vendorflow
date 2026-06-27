import { prisma } from '@/lib/prisma';
import type { PaymentProviderAdapter } from '@/lib/payments/adapters/base';
import { stripeConnectEmulator } from '@/lib/payments/adapters/stripe-connect-emulator';
import { parseMilestones } from '@/lib/payments/contract-engine';
import type { CheckoutSessionRequest, InvoiceStatus, PaymentMilestone } from '@/lib/payments/types';

const adapters = new Map<string, PaymentProviderAdapter>([
  ['stripe-emulator', stripeConnectEmulator],
  ['stripe', stripeConnectEmulator],
]);

export function getPaymentAdapter(provider = 'stripe-emulator'): PaymentProviderAdapter {
  return adapters.get(provider) ?? stripeConnectEmulator;
}

async function ensureSeeded() {
  const { ensurePlatformSeed } = await import('@/lib/platform-seed');
  await ensurePlatformSeed();
}

export async function listInvoices(filters: {
  organizerId?: string;
  vendorPassportId?: string;
  vendorEmail?: string;
  status?: string;
}) {
  await ensureSeeded();

  let vendorPassportId = filters.vendorPassportId;
  if (filters.vendorEmail && !vendorPassportId) {
    const p = await prisma.vendorPassport.findUnique({ where: { vendorEmail: filters.vendorEmail } });
    vendorPassportId = p?.id;
  }

  return prisma.invoice.findMany({
    where: {
      organizerId: filters.organizerId,
      vendorPassportId,
      status: filters.status,
    },
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' } },
      splits: true,
      payments: true,
      contracts: { include: { template: true } },
      vendor: { select: { businessName: true, vendorEmail: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCheckout(params: CheckoutSessionRequest & { provider?: string }) {
  await ensureSeeded();

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: params.invoiceId },
    include: { payments: true, contracts: true },
  });

  let amountCents = invoice.totalAmountCents;
  if (params.milestoneId && invoice.contracts[0]) {
    const milestones = parseMilestones(invoice.contracts[0].milestones) as PaymentMilestone[];
    const milestone = milestones.find(m => m.id === params.milestoneId);
    if (milestone?.amountCents) amountCents = milestone.amountCents;
  }

  const adapter = getPaymentAdapter(params.provider);
  const session = await adapter.createCheckoutSession(params);

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amountCents,
      status: 'pending',
      provider: adapter.name,
      externalPaymentId: session.sessionId,
      milestoneId: params.milestoneId,
      metadata: JSON.stringify({ checkoutUrl: session.checkoutUrl }),
    },
  });

  return { session: { ...session, amountCents }, payment };
}

export async function completeCheckout(sessionId: string) {
  const payment = await prisma.payment.findFirst({
    where: { externalPaymentId: sessionId },
    include: { invoice: { include: { payments: true } } },
  });
  if (!payment) throw new Error('Payment session not found');

  const adapter = getPaymentAdapter(payment.provider);
  const result = await adapter.handleWebhook({
    type: 'checkout.session.completed',
    provider: payment.provider,
    externalId: sessionId,
    payload: {
      invoiceId: payment.invoiceId,
      paymentId: payment.id,
      fullyPaid: false,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'succeeded', metadata: JSON.stringify({ completedAt: new Date().toISOString() }) },
  });

  const paidTotal = payment.invoice.payments
    .filter(p => p.status === 'succeeded')
    .reduce((s, p) => s + p.amountCents, 0) + payment.amountCents;

  let newStatus: InvoiceStatus = 'partial';
  if (paidTotal >= payment.invoice.totalAmountCents) newStatus = 'paid';
  else if (paidTotal === 0) newStatus = payment.invoice.status as InvoiceStatus;

  await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date() : undefined,
    },
  });

  return { payment, result, newStatus };
}

export async function handlePaymentWebhook(body: Record<string, unknown>) {
  const provider = (body.provider as string) ?? 'stripe-emulator';
  const adapter = getPaymentAdapter(provider);
  return adapter.handleWebhook({
    type: (body.type as string) ?? 'unknown',
    provider,
    externalId: (body.externalId as string) ?? '',
    payload: body,
  });
}

export function serializeInvoice(inv: Awaited<ReturnType<typeof listInvoices>>[number]) {
  return {
    ...inv,
    vendorName: inv.vendor?.businessName,
    vendorEmail: inv.vendor?.vendorEmail,
    lineItems: inv.lineItems,
    splits: inv.splits,
    payments: inv.payments,
    contract: inv.contracts[0] ?? null,
  };
}

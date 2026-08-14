import { NextRequest, NextResponse } from 'next/server';
import { completeCheckout, createCheckout } from '@/lib/payments/payment-service';
import { requireRole } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

/** GET — complete emulated checkout when session param present */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Emulated checkout is disabled' }, { status: 404 });
  }
  const session = req.nextUrl.searchParams.get('session');
  const invoiceId = req.nextUrl.searchParams.get('invoiceId');

  if (!session) {
    return NextResponse.json({ ok: false, error: 'Missing session parameter' }, { status: 400 });
  }

  try {
    const { payment, newStatus } = await completeCheckout(session);
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const redirect = invoiceId
      ? `${base}/vendor?tab=invoicing&paid=1&invoice=${invoiceId}`
      : `${base}/vendor?tab=invoicing&paid=1`;
    return NextResponse.redirect(`${redirect}&status=${newStatus}&payment=${payment.id}`);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}

/** POST — create checkout session for invoice / milestone */
export async function POST(req: NextRequest) {
  try {
    const auth = requireRole(req, 'vendor'); if (!auth.ok) return auth.response;
    const body = await req.json();
    if (!body.invoiceId || !body.successUrl || !body.cancelUrl) {
      return NextResponse.json(
        { ok: false, error: 'invoiceId, successUrl, cancelUrl required' },
        { status: 400 }
      );
    }
    const invoice = await prisma.invoice.findFirst({
      where: { id: body.invoiceId, vendor: { vendorEmail: auth.session.email } },
      select: { id: true },
    });
    if (!invoice) {
      return NextResponse.json({ ok: false, error: 'Invoice not found' }, { status: 404 });
    }
    if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Payments are not configured yet' },
        { status: 503 }
      );
    }
    const configuredBase = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    let base = req.nextUrl.origin;
    try { base = new URL(configuredBase).origin; } catch { /* use request origin */ }
    const { session, payment } = await createCheckout({
      ...body,
      successUrl: `${base}/vendor?tab=invoicing&paid=1&invoice=${encodeURIComponent(body.invoiceId)}`,
      cancelUrl: `${base}/vendor?tab=invoicing&cancelled=1&invoice=${encodeURIComponent(body.invoiceId)}`,
    });
    return NextResponse.json({
      ok: true,
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
      amountCents: session.amountCents,
      paymentId: payment.id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}

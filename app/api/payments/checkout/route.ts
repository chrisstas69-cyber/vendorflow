import { NextRequest, NextResponse } from 'next/server';
import { completeCheckout, createCheckout } from '@/lib/payments/payment-service';

/** GET — complete emulated checkout when session param present */
export async function GET(req: NextRequest) {
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
    const body = await req.json();
    if (!body.invoiceId || !body.successUrl || !body.cancelUrl) {
      return NextResponse.json(
        { ok: false, error: 'invoiceId, successUrl, cancelUrl required' },
        { status: 400 }
      );
    }
    const { session, payment } = await createCheckout(body);
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

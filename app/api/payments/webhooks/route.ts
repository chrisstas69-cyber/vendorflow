import { NextRequest, NextResponse } from 'next/server';
import { reconcileStripeCheckout } from '@/lib/payments/payment-service';

/** POST — Stripe Connect-style webhook handler (emulator + future live Stripe) */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!signingSecret || !stripeKey) {
    return NextResponse.json(
      { ok: false, error: 'Payment webhooks are not configured' },
      { status: 503 }
    );
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ ok: false, error: 'Missing Stripe signature' }, { status: 401 });
    }
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
    const event = stripe.webhooks.constructEvent(await req.text(), signature, signingSecret);
    if (event.type !== 'checkout.session.completed') {
      return NextResponse.json({ ok: true, ignored: true });
    }
    const result = await reconcileStripeCheckout(event.data.object);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Invalid webhook' },
      { status: 400 }
    );
  }
}

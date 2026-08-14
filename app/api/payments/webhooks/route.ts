import { NextRequest, NextResponse } from 'next/server';
import { reconcileStripeCheckout } from '@/lib/payments/payment-service';

/** POST — Stripe Connect-style webhook handler (emulator + future live Stripe) */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signingSecret) {
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
    // Signature verification is local cryptography and does not require an API
    // credential. Keeping it independent lets sandbox webhooks be verified
    // without ever enabling sandbox checkout on the production site.
    const event = Stripe.webhooks.constructEvent(await req.text(), signature, signingSecret);
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

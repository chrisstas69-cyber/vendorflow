import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/lib/payments/payment-service';

/** POST — Stripe Connect-style webhook handler (emulator + future live Stripe) */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  const expected = process.env.PAYMENTS_WEBHOOK_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ ok: false, error: 'Invalid webhook secret' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await handlePaymentWebhook(body);
    return NextResponse.json({ ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}

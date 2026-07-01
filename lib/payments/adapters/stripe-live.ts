import type { PaymentProviderAdapter } from '@/lib/payments/adapters/base';
import type {
  CheckoutSessionRequest,
  CheckoutSessionResult,
  ConnectAccountRequest,
  ConnectAccountResult,
  WebhookEvent,
} from '@/lib/payments/types';

/**
 * Live Stripe Checkout — activates when STRIPE_SECRET_KEY is set.
 * Falls back to emulator via payment-service when unset.
 */
export class StripeLiveAdapter implements PaymentProviderAdapter {
  readonly name = 'stripe';

  private get stripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require('stripe') as typeof import('stripe').default;
    return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }

  async createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    const stripe = this.stripe;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: req.amountCents ?? 0,
            product_data: { name: req.description ?? 'VendorFlow invoice' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: req.invoiceId,
        milestoneId: req.milestoneId ?? '',
      },
    });
    return {
      sessionId: session.id,
      checkoutUrl: session.url ?? req.successUrl,
      amountCents: req.amountCents ?? 0,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<import('@/lib/payments/types').WebhookHandleResult> {
    if (event.type === 'checkout.session.completed') {
      return {
        ok: true,
        message: 'Checkout completed',
        invoiceId: event.payload.invoiceId as string | undefined,
        paymentId: event.payload.paymentId as string | undefined,
        newInvoiceStatus: event.payload.fullyPaid ? 'paid' : 'partial',
      };
    }
    return { ok: true, message: 'Ignored' };
  }

  async createConnectAccount(params: ConnectAccountRequest): Promise<ConnectAccountResult> {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';
    return {
      accountId: `acct_live_pending_${params.ownerId}`,
      onboardingUrl: `${base}/setup?stripe_connect=1`,
      onboardingStatus: 'pending',
    };
  }
}

export const stripeLiveAdapter = new StripeLiveAdapter();

export function isStripeLiveConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));
}

import type { PaymentProviderAdapter } from '@/lib/payments/adapters/base';
import type {
  CheckoutSessionRequest,
  CheckoutSessionResult,
  ConnectAccountRequest,
  ConnectAccountResult,
  WebhookEvent,
  WebhookHandleResult,
} from '@/lib/payments/types';

/**
 * Stripe Connect emulator — processes multi-party booth fees without live Stripe keys.
 * Maps to Payment + PaymentSplit rows and simulates webhook completion.
 */
export class StripeConnectEmulatorAdapter implements PaymentProviderAdapter {
  readonly name = 'stripe-emulator';

  async createCheckoutSession(params: CheckoutSessionRequest): Promise<CheckoutSessionResult> {
    const sessionId = `cs_emul_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';
    return {
      sessionId,
      checkoutUrl: `${base}/api/payments/checkout?session=${sessionId}&invoiceId=${params.invoiceId}${params.milestoneId ? `&milestone=${params.milestoneId}` : ''}`,
      amountCents: 0,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<WebhookHandleResult> {
    const invoiceId = event.payload.invoiceId as string | undefined;
    const paymentId = event.payload.paymentId as string | undefined;

    if (event.type === 'checkout.session.completed') {
      return {
        ok: true,
        invoiceId,
        paymentId,
        newInvoiceStatus: event.payload.fullyPaid ? 'paid' : 'partial',
        message: 'Checkout session completed (emulated)',
      };
    }

    if (event.type === 'transfer.paid') {
      return { ok: true, invoiceId, paymentId, message: 'Payout transfer completed (emulated)' };
    }

    return { ok: false, message: `Unhandled webhook type: ${event.type}` };
  }

  async createConnectAccount(params: ConnectAccountRequest): Promise<ConnectAccountResult> {
    const accountId = `acct_emul_${params.ownerType}_${params.ownerId.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002';
    return {
      accountId,
      onboardingUrl: `${base}/setup?connect=${accountId}`,
      onboardingStatus: 'complete',
    };
  }
}

export const stripeConnectEmulator = new StripeConnectEmulatorAdapter();

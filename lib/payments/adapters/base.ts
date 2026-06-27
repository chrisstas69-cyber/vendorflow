import type {
  CheckoutSessionRequest,
  CheckoutSessionResult,
  ConnectAccountRequest,
  ConnectAccountResult,
  WebhookEvent,
  WebhookHandleResult,
} from '@/lib/payments/types';

/** Modular payment provider adapter — swap Stripe, manual, or emulator */
export interface PaymentProviderAdapter {
  readonly name: string;

  createCheckoutSession(params: CheckoutSessionRequest): Promise<CheckoutSessionResult>;

  handleWebhook(event: WebhookEvent): Promise<WebhookHandleResult>;

  createConnectAccount(params: ConnectAccountRequest): Promise<ConnectAccountResult>;
}

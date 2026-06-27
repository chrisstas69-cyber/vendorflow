/** Shared payment & contract types */

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void' | 'overdue';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
export type ContractStatus =
  | 'draft'
  | 'sent'
  | 'signed_vendor'
  | 'signed_organizer'
  | 'active'
  | 'cancelled';

export interface PaymentMilestone {
  id: string;
  label: string;
  /** Basis points of invoice total (5000 = 50%) */
  percentBps: number;
  /** Days relative to event date (negative = before event, e.g. -30) */
  dueOffsetDays?: number;
  /** Absolute due date ISO string (overrides offset when set) */
  dueDate?: string;
  amountCents?: number;
}

export interface CheckoutSessionRequest {
  invoiceId: string;
  milestoneId?: string;
  successUrl: string;
  cancelUrl: string;
  payerEmail?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  amountCents: number;
  expiresAt: string;
}

export interface WebhookEvent {
  type: string;
  provider: string;
  externalId: string;
  payload: Record<string, unknown>;
}

export interface WebhookHandleResult {
  ok: boolean;
  paymentId?: string;
  invoiceId?: string;
  newInvoiceStatus?: InvoiceStatus;
  message: string;
}

export interface ConnectAccountRequest {
  ownerType: 'vendor' | 'organizer' | 'platform';
  ownerId: string;
  email: string;
  displayName?: string;
}

export interface ConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
  onboardingStatus: string;
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partially Paid',
  paid: 'Paid',
  void: 'Void',
  overdue: 'Overdue',
};

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  void: 'bg-gray-100 text-gray-500 line-through',
  overdue: 'bg-red-100 text-red-800',
};

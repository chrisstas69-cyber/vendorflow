# Payments & Contracts — Multi-Party Splits (Phase 2)

## Goal
Booth fees, milestone e-sign contracts, and Stripe Connect–ready multi-party checkout.

## Prisma models
| Model | Purpose |
|-------|---------|
| `PaymentAccount` | Payout identity per vendor / organizer / platform |
| `Invoice` + `InvoiceLineItem` | Booth + permit fees |
| `PaymentSplit` | Organizer / platform allocation (`percentBps`) |
| `Payment` | Checkout session + settlement records |
| `ContractTemplate` | Reusable agreement body + default milestones |
| `Contract` | Generated e-sign doc per invoice |

## Contract engine (`lib/payments/contract-engine.ts`)
Default milestone schedule:
- 50% deposit upfront
- 50% balance 30 days before event

## Payment adapter pattern
- `PaymentProviderAdapter` interface (`lib/payments/adapters/base.ts`)
- `StripeConnectEmulatorAdapter` — dev checkout + webhooks without live keys

## API
| Method | Route | Purpose |
|--------|-------|---------|
| GET, POST | `/api/payments/invoices` | List / create with contract |
| GET, POST | `/api/payments/checkout` | Start + complete emulated checkout |
| POST | `/api/payments/webhooks` | Connect-style webhook handler |
| GET, POST | `/api/payments/accounts` | Payout accounts |

## UI
- Vendor passport → **Invoicing** tab
- `/organizer/invoicing` — organizer invoice list with status badges

## Phase 3
- Live Stripe Connect keys
- PDF export + DocuSign

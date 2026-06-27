import type { PaymentMilestone } from '@/lib/payments/types';

export interface ContractGenerateInput {
  templateBody: string;
  vendorName: string;
  organizerName: string;
  eventName: string;
  eventDate: string;
  totalAmountCents: number;
  milestones: PaymentMilestone[];
}

export interface GeneratedContract {
  documentBody: string;
  milestones: PaymentMilestone[];
}

const DEFAULT_MILESTONES: PaymentMilestone[] = [
  { id: 'deposit', label: 'Deposit (50% upfront)', percentBps: 5000, dueOffsetDays: 0 },
  { id: 'balance', label: 'Balance (50% due 30 days before event)', percentBps: 5000, dueOffsetDays: -30 },
];

export function parseMilestones(json: string): PaymentMilestone[] {
  try {
    const parsed = JSON.parse(json) as PaymentMilestone[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MILESTONES;
  } catch {
    return DEFAULT_MILESTONES;
  }
}

export function resolveMilestoneDueDates(
  milestones: PaymentMilestone[],
  eventDateIso: string,
  totalAmountCents: number
): PaymentMilestone[] {
  const eventMs = new Date(eventDateIso + 'T12:00:00').getTime();

  return milestones.map(m => {
    const amountCents = m.amountCents ?? Math.round((totalAmountCents * m.percentBps) / 10000);
    let dueDate = m.dueDate;

    if (!dueDate && m.dueOffsetDays !== undefined) {
      const dueMs = eventMs + m.dueOffsetDays * 24 * 60 * 60 * 1000;
      dueDate = new Date(dueMs).toISOString().slice(0, 10);
    } else if (!dueDate) {
      dueDate = new Date().toISOString().slice(0, 10);
    }

    return { ...m, amountCents, dueDate };
  });
}

export function generateContractDocument(input: ContractGenerateInput): GeneratedContract {
  const milestones = resolveMilestoneDueDates(
    input.milestones,
    input.eventDate,
    input.totalAmountCents
  );

  const milestoneLines = milestones
    .map(
      m =>
        `- **${m.label}**: $${((m.amountCents ?? 0) / 100).toFixed(2)} due ${m.dueDate}${m.dueOffsetDays !== undefined && m.dueOffsetDays < 0 ? ` (${Math.abs(m.dueOffsetDays)} days before event)` : ''}`
    )
    .join('\n');

  const total = `$${(input.totalAmountCents / 100).toFixed(2)}`;

  const documentBody = input.templateBody
    .replace(/\{\{vendorName\}\}/g, input.vendorName)
    .replace(/\{\{organizerName\}\}/g, input.organizerName)
    .replace(/\{\{eventName\}\}/g, input.eventName)
    .replace(/\{\{eventDate\}\}/g, input.eventDate)
    .replace(/\{\{totalAmount\}\}/g, total)
    .replace(/\{\{milestoneSchedule\}\}/g, milestoneLines);

  return { documentBody, milestones };
}

export const BOOTH_FEE_TEMPLATE_BODY = `# Vendor Booth Agreement

This agreement is between **{{organizerName}}** ("Organizer") and **{{vendorName}}** ("Vendor") for participation in **{{eventName}}** on **{{eventDate}}**.

## Booth fee
Total booth fee: **{{totalAmount}}**

## Payment schedule
{{milestoneSchedule}}

## E-signatures
By signing electronically below, both parties agree to the terms above including the milestone payment schedule.

- Vendor signature: _________________________ Date: _________
- Organizer signature: ______________________ Date: _________
`;

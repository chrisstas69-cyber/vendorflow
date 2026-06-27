import { prisma } from '@/lib/prisma';
import {
  BOOTH_FEE_TEMPLATE_BODY,
  generateContractDocument,
  parseMilestones,
} from '@/lib/payments/contract-engine';
import type { PaymentMilestone } from '@/lib/payments/types';
import { DEMO_VENDOR_EMAIL } from '@/lib/vendor-passport';
import { DEMO_ORGANIZER_ID, mockPlatformEvents } from '@/lib/platform-data';

export async function ensurePaymentSeed() {
  const tpl = await prisma.contractTemplate.findUnique({ where: { slug: 'booth-fee-standard' } });
  if (tpl) {
    const existing = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-DEMO-001' } });
    if (existing) return;
  }

  if (!tpl) {
    const milestones: PaymentMilestone[] = [
      { id: 'deposit', label: 'Deposit (50% upfront)', percentBps: 5000, dueOffsetDays: 0 },
      { id: 'balance', label: 'Balance (50% due 30 days before event)', percentBps: 5000, dueOffsetDays: -30 },
    ];

    await prisma.contractTemplate.create({
      data: {
        slug: 'booth-fee-standard',
        name: 'Standard Booth Fee Agreement',
        description: '50% deposit upfront, 50% balance 30 days before event',
        bodyTemplate: BOOTH_FEE_TEMPLATE_BODY,
        defaultMilestones: JSON.stringify(milestones),
      },
    });
  }

  let passport = await prisma.vendorPassport.findUnique({ where: { vendorEmail: DEMO_VENDOR_EMAIL } });
  if (!passport) {
    passport = await prisma.vendorPassport.create({
      data: {
        vendorEmail: DEMO_VENDOR_EMAIL,
        businessName: 'Demo Vendor Co.',
        contactName: 'Alex Rivera',
        phone: '(516) 555-0142',
        categories: JSON.stringify(['LED Toys & Novelties']),
        serviceTags: JSON.stringify(['family-friendly', 'liability-insured']),
        validationState: 'ready_for_matching',
        complianceScore: 92,
        vehicleType: 'van',
        boothWidthFt: 10,
        boothDepthFt: 10,
      },
    });
  }

  await prisma.paymentAccount.upsert({
    where: {
      ownerType_ownerId_provider: {
        ownerType: 'organizer',
        ownerId: DEMO_ORGANIZER_ID,
        provider: 'stripe-emulator',
      },
    },
    create: {
      ownerType: 'organizer',
      ownerId: DEMO_ORGANIZER_ID,
      provider: 'stripe-emulator',
      displayName: 'Demo Organizer Events',
      onboardingStatus: 'complete',
      payoutEnabled: true,
      externalAccountId: `acct_emul_org_${DEMO_ORGANIZER_ID}`,
    },
    update: { onboardingStatus: 'complete', payoutEnabled: true },
  });

  await prisma.paymentAccount.upsert({
    where: {
      ownerType_ownerId_provider: {
        ownerType: 'vendor',
        ownerId: DEMO_VENDOR_EMAIL,
        provider: 'stripe-emulator',
      },
    },
    create: {
      ownerType: 'vendor',
      ownerId: DEMO_VENDOR_EMAIL,
      provider: 'stripe-emulator',
      displayName: 'Demo Vendor Co.',
      onboardingStatus: 'complete',
      payoutEnabled: true,
      externalAccountId: 'acct_emul_vendor_demo',
    },
    update: {},
  });

  const event = mockPlatformEvents[0];
  const existing = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-DEMO-001' } });
  if (existing) return;

  const totalCents = event.boothFee * 100 + event.permitFee * 100;
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-DEMO-001',
      status: 'sent',
      organizerId: DEMO_ORGANIZER_ID,
      eventId: event.id,
      vendorPassportId: passport.id,
      totalAmountCents: totalCents,
      dueDate: new Date(event.date),
      lineItems: {
        create: [
          { label: 'Booth fee', amountCents: event.boothFee * 100, sortOrder: 0 },
          { label: 'Permit fee', amountCents: event.permitFee * 100, sortOrder: 1 },
        ],
      },
      splits: {
        create: [
          { payeeType: 'organizer', payeeLabel: 'Organizer share', percentBps: 8500, status: 'pending' },
          { payeeType: 'platform', payeeLabel: 'VendorFlow fee', percentBps: 1500, status: 'pending' },
        ],
      },
    },
  });

  const template = await prisma.contractTemplate.findUniqueOrThrow({ where: { slug: 'booth-fee-standard' } });
  const { documentBody, milestones: resolved } = generateContractDocument({
    templateBody: template.bodyTemplate,
    vendorName: passport.businessName,
    organizerName: 'Demo Organizer Events',
    eventName: event.name,
    eventDate: event.date,
    totalAmountCents: totalCents,
    milestones: parseMilestones(template.defaultMilestones),
  });

  await prisma.contract.create({
    data: {
      templateId: template.id,
      invoiceId: invoice.id,
      vendorPassportId: passport.id,
      organizerId: DEMO_ORGANIZER_ID,
      eventId: event.id,
      status: 'sent',
      milestones: JSON.stringify(resolved),
      documentBody,
    },
  });
}

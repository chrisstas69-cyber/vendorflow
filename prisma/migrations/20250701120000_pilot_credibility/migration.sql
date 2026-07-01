-- AlterTable
ALTER TABLE "VendorApplication" ADD COLUMN "internalNotes" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "VendorPassport" ADD COLUMN "planId" TEXT NOT NULL DEFAULT 'vendor-free';

-- CreateTable
CREATE TABLE "VendorFinancial" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorPassportId" TEXT,
    "vendorEmail" TEXT NOT NULL,
    "eventId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "grossSalesCents" INTEGER NOT NULL,
    "expensesCents" INTEGER NOT NULL,
    "netProfitCents" INTEGER NOT NULL,
    "marginBps" INTEGER NOT NULL,
    "breakEvenHour" TEXT,
    "bestHour" TEXT,
    "cashPercent" INTEGER,
    "cardPercent" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'import',

    CONSTRAINT "VendorFinancial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorReceipt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorPassportId" TEXT,
    "vendorEmail" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "fileName" TEXT,
    "imageData" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "VendorReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorFinancial_vendorEmail_eventName_eventDate_key" ON "VendorFinancial"("vendorEmail", "eventName", "eventDate");

-- CreateIndex
CREATE INDEX "VendorFinancial_vendorEmail_eventDate_idx" ON "VendorFinancial"("vendorEmail", "eventDate");

-- CreateIndex
CREATE INDEX "VendorReceipt_vendorEmail_idx" ON "VendorReceipt"("vendorEmail");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_token_key" ON "MagicLinkToken"("token");

-- CreateIndex
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");

-- AddForeignKey
ALTER TABLE "VendorFinancial" ADD CONSTRAINT "VendorFinancial_vendorPassportId_fkey" FOREIGN KEY ("vendorPassportId") REFERENCES "VendorPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorReceipt" ADD CONSTRAINT "VendorReceipt_vendorPassportId_fkey" FOREIGN KEY ("vendorPassportId") REFERENCES "VendorPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

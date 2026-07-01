-- AlterTable
ALTER TABLE "VendorApplication" ADD COLUMN "ce200SentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QueuedEmail" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "templateId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "applicationId" TEXT,
    "organizerId" TEXT,

    CONSTRAINT "QueuedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueuedEmail_status_createdAt_idx" ON "QueuedEmail"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QueuedEmail_applicationId_idx" ON "QueuedEmail"("applicationId");

-- CreateIndex
CREATE INDEX "QueuedEmail_toEmail_idx" ON "QueuedEmail"("toEmail");

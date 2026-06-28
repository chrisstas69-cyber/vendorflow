npm warn Unknown env config "devdir". This will stop working in the next major version of npm.
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "OrganizerAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "region" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT NOT NULL DEFAULT 'org-founders',

    CONSTRAINT "OrganizerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "seriesId" TEXT,
    "vendorEmail" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pipelineStage" TEXT NOT NULL DEFAULT 'applied',
    "shortlisted" BOOLEAN NOT NULL DEFAULT false,
    "infoRequested" BOOLEAN NOT NULL DEFAULT false,
    "requiredForms" TEXT NOT NULL DEFAULT '[]',
    "uploadedDocTypes" TEXT NOT NULL DEFAULT '[]',
    "setupPhotoUrl" TEXT,
    "hasInsurance" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'none',
    "contractStatus" TEXT NOT NULL DEFAULT 'unsigned',
    "passportId" TEXT,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothMap" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main grid',
    "layoutMode" TEXT NOT NULL DEFAULT 'grid',
    "gridJson" TEXT NOT NULL DEFAULT '[]',
    "streetFairJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "BoothMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boothMapId" TEXT NOT NULL,
    "boothLabel" TEXT NOT NULL,
    "applicationId" TEXT,
    "vendorEmail" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "utilities" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "BoothAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTimeline" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL DEFAULT 'planning',
    "stagesJson" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "EventTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityFeedItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),
    "eventId" TEXT,

    CONSTRAINT "ActivityFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "applicationId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPassport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorEmail" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "dba" TEXT,
    "contactName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "website" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "categories" TEXT NOT NULL DEFAULT '[]',
    "serviceTags" TEXT NOT NULL DEFAULT '[]',
    "validationState" TEXT NOT NULL DEFAULT 'incomplete',
    "complianceScore" INTEGER NOT NULL DEFAULT 0,
    "insuranceExpiry" TIMESTAMP(3),
    "setupPhotoUrl" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'tent-only',
    "trailerLengthFt" DOUBLE PRECISION,
    "boothWidthFt" DOUBLE PRECISION,
    "boothDepthFt" DOUBLE PRECISION,
    "needsElectric" BOOLEAN NOT NULL DEFAULT false,
    "ampRequirement" TEXT,
    "setupTimeMinutes" INTEGER,
    "waterAccess" BOOLEAN,
    "generatorOk" BOOLEAN,

    CONSTRAINT "VendorPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSeries" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "organizerId" TEXT NOT NULL,
    "seasonLabel" TEXT,
    "coverImageUrl" TEXT,

    CONSTRAINT "EventSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesEvent" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "SeriesEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "externalAccountId" TEXT,
    "displayName" TEXT,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'pending',
    "payoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "seriesId" TEXT,
    "vendorPassportId" TEXT,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSplit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "payeeAccountId" TEXT,
    "payeeType" TEXT NOT NULL,
    "payeeLabel" TEXT,
    "amountCents" INTEGER,
    "percentBps" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "externalTransferId" TEXT,

    CONSTRAINT "PaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "externalPaymentId" TEXT,
    "paymentMethod" TEXT,
    "milestoneId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "bodyTemplate" TEXT NOT NULL,
    "defaultMilestones" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "vendorPassportId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "documentBody" TEXT NOT NULL DEFAULT '',
    "signedAtVendor" TIMESTAMP(3),
    "signedAtOrganizer" TIMESTAMP(3),
    "documentUrl" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "requiredForCategories" TEXT NOT NULL DEFAULT '[]',
    "salesTaxRateBps" INTEGER,
    "permitTemplateUrl" TEXT,
    "isFoundersEdition" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "modelVersion" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "organizerId" TEXT,
    "passportId" TEXT,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "county" TEXT,
    "town" TEXT,
    "region" TEXT NOT NULL DEFAULT 'long-island',
    "state" TEXT NOT NULL DEFAULT 'NY',

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsOrganization" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "address" TEXT,
    "jurisdictionId" TEXT,
    "jurisdictionCoverage" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "recurringEventTypes" TEXT NOT NULL DEFAULT '[]',
    "vendorHeavy" BOOLEAN NOT NULL DEFAULT false,
    "fitScore" INTEGER NOT NULL DEFAULT 0,
    "internalOnly" BOOLEAN NOT NULL DEFAULT true,
    "outreachStatus" TEXT NOT NULL DEFAULT 'lead',
    "defaultVisibility" TEXT NOT NULL DEFAULT 'internal',
    "canonicalName" TEXT,
    "normalizedDomain" TEXT,
    "dedupeKey" TEXT,
    "county" TEXT,
    "town" TEXT,
    "sourceSystem" TEXT,
    "sourceFile" TEXT,
    "sourceUrl" TEXT,
    "sourcePriority" INTEGER NOT NULL DEFAULT 50,
    "lastImportedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "importRunId" TEXT,
    "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OpsOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsContact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "linkedIn" TEXT,
    "department" TEXT,
    "preferredContactMethod" TEXT NOT NULL DEFAULT 'email',
    "purposeTags" TEXT NOT NULL DEFAULT '[]',
    "visibility" TEXT NOT NULL DEFAULT 'organizer-only',
    "notes" TEXT NOT NULL DEFAULT '',
    "internalNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OpsContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationEventProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventDistrict" TEXT,
    "eventTypes" TEXT NOT NULL DEFAULT '[]',
    "seasonality" TEXT,
    "typicalVendorCount" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OrganizationEventProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,
    "contactId" TEXT,
    "activityType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorLabel" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "OutreachActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceSystem" TEXT NOT NULL,
    "sourceFile" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "rowsProcessed" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "summaryJson" TEXT NOT NULL DEFAULT '{}',
    "actorLabel" TEXT,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeSourceHealth" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastError" TEXT,
    "outputCount" INTEGER,
    "region" TEXT,
    "category" TEXT,

    CONSTRAINT "ScrapeSourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerAccount_slug_key" ON "OrganizerAccount"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerAccount_email_key" ON "OrganizerAccount"("email");

-- CreateIndex
CREATE INDEX "OrganizerAccount_slug_idx" ON "OrganizerAccount"("slug");

-- CreateIndex
CREATE INDEX "VendorApplication_organizerId_eventId_idx" ON "VendorApplication"("organizerId", "eventId");

-- CreateIndex
CREATE INDEX "VendorApplication_organizerId_status_idx" ON "VendorApplication"("organizerId", "status");

-- CreateIndex
CREATE INDEX "VendorApplication_vendorEmail_idx" ON "VendorApplication"("vendorEmail");

-- CreateIndex
CREATE UNIQUE INDEX "BoothMap_organizerId_eventId_key" ON "BoothMap"("organizerId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BoothAssignment_applicationId_key" ON "BoothAssignment"("applicationId");

-- CreateIndex
CREATE INDEX "BoothAssignment_vendorEmail_idx" ON "BoothAssignment"("vendorEmail");

-- CreateIndex
CREATE UNIQUE INDEX "BoothAssignment_boothMapId_boothLabel_key" ON "BoothAssignment"("boothMapId", "boothLabel");

-- CreateIndex
CREATE UNIQUE INDEX "EventTimeline_organizerId_eventId_key" ON "EventTimeline"("organizerId", "eventId");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_organizerId_createdAt_idx" ON "ActivityFeedItem"("organizerId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_organizerId_readAt_idx" ON "ActivityFeedItem"("organizerId", "readAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizerId_createdAt_idx" ON "AuditLog"("organizerId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Notification_organizerId_status_idx" ON "Notification"("organizerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPassport_vendorEmail_key" ON "VendorPassport"("vendorEmail");

-- CreateIndex
CREATE INDEX "VendorPassport_validationState_idx" ON "VendorPassport"("validationState");

-- CreateIndex
CREATE INDEX "VendorDocument_passportId_type_idx" ON "VendorDocument"("passportId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EventSeries_slug_key" ON "EventSeries"("slug");

-- CreateIndex
CREATE INDEX "EventSeries_organizerId_idx" ON "EventSeries"("organizerId");

-- CreateIndex
CREATE INDEX "SeriesEvent_eventId_idx" ON "SeriesEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesEvent_seriesId_eventId_key" ON "SeriesEvent"("seriesId", "eventId");

-- CreateIndex
CREATE INDEX "PaymentAccount_ownerId_idx" ON "PaymentAccount"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_ownerType_ownerId_provider_key" ON "PaymentAccount"("ownerType", "ownerId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_organizerId_status_idx" ON "Invoice"("organizerId", "status");

-- CreateIndex
CREATE INDEX "Invoice_eventId_idx" ON "Invoice"("eventId");

-- CreateIndex
CREATE INDEX "Invoice_vendorPassportId_idx" ON "Invoice"("vendorPassportId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentSplit_invoiceId_idx" ON "PaymentSplit"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentSplit_payeeAccountId_idx" ON "PaymentSplit"("payeeAccountId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_status_idx" ON "Payment"("invoiceId", "status");

-- CreateIndex
CREATE INDEX "Payment_externalPaymentId_idx" ON "Payment"("externalPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_slug_key" ON "ContractTemplate"("slug");

-- CreateIndex
CREATE INDEX "Contract_vendorPassportId_idx" ON "Contract"("vendorPassportId");

-- CreateIndex
CREATE INDEX "Contract_organizerId_status_idx" ON "Contract"("organizerId", "status");

-- CreateIndex
CREATE INDEX "ComplianceRule_region_documentType_idx" ON "ComplianceRule"("region", "documentType");

-- CreateIndex
CREATE INDEX "AIInsight_scopeType_scopeId_status_idx" ON "AIInsight"("scopeType", "scopeId", "status");

-- CreateIndex
CREATE INDEX "AIInsight_insightType_status_idx" ON "AIInsight"("insightType", "status");

-- CreateIndex
CREATE INDEX "AIInsight_expiresAt_idx" ON "AIInsight"("expiresAt");

-- CreateIndex
CREATE INDEX "GalleryItem_entityType_entityId_idx" ON "GalleryItem"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "GalleryItem_entityType_entityId_isPublic_idx" ON "GalleryItem"("entityType", "entityId", "isPublic");

-- CreateIndex
CREATE INDEX "GalleryItem_organizerId_idx" ON "GalleryItem"("organizerId");

-- CreateIndex
CREATE INDEX "GalleryItem_passportId_idx" ON "GalleryItem"("passportId");

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_slug_key" ON "Jurisdiction"("slug");

-- CreateIndex
CREATE INDEX "Jurisdiction_county_town_idx" ON "Jurisdiction"("county", "town");

-- CreateIndex
CREATE INDEX "Jurisdiction_region_idx" ON "Jurisdiction"("region");

-- CreateIndex
CREATE UNIQUE INDEX "OpsOrganization_dedupeKey_key" ON "OpsOrganization"("dedupeKey");

-- CreateIndex
CREATE INDEX "OpsOrganization_type_idx" ON "OpsOrganization"("type");

-- CreateIndex
CREATE INDEX "OpsOrganization_jurisdictionId_idx" ON "OpsOrganization"("jurisdictionId");

-- CreateIndex
CREATE INDEX "OpsOrganization_outreachStatus_idx" ON "OpsOrganization"("outreachStatus");

-- CreateIndex
CREATE INDEX "OpsOrganization_internalOnly_idx" ON "OpsOrganization"("internalOnly");

-- CreateIndex
CREATE INDEX "OpsOrganization_sourceSystem_idx" ON "OpsOrganization"("sourceSystem");

-- CreateIndex
CREATE INDEX "OpsOrganization_dedupeKey_idx" ON "OpsOrganization"("dedupeKey");

-- CreateIndex
CREATE INDEX "OpsOrganization_normalizedDomain_idx" ON "OpsOrganization"("normalizedDomain");

-- CreateIndex
CREATE INDEX "OpsContact_organizationId_idx" ON "OpsContact"("organizationId");

-- CreateIndex
CREATE INDEX "OpsContact_visibility_idx" ON "OpsContact"("visibility");

-- CreateIndex
CREATE INDEX "OrganizationEventProfile_organizationId_idx" ON "OrganizationEventProfile"("organizationId");

-- CreateIndex
CREATE INDEX "OutreachActivity_organizationId_createdAt_idx" ON "OutreachActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OutreachActivity_contactId_createdAt_idx" ON "OutreachActivity"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportRun_createdAt_idx" ON "ImportRun"("createdAt");

-- CreateIndex
CREATE INDEX "ImportRun_sourceSystem_idx" ON "ImportRun"("sourceSystem");

-- CreateIndex
CREATE INDEX "ScrapeSourceHealth_status_idx" ON "ScrapeSourceHealth"("status");

-- CreateIndex
CREATE INDEX "ScrapeSourceHealth_active_idx" ON "ScrapeSourceHealth"("active");

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "VendorPassport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothMap" ADD CONSTRAINT "BoothMap_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothAssignment" ADD CONSTRAINT "BoothAssignment_boothMapId_fkey" FOREIGN KEY ("boothMapId") REFERENCES "BoothMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothAssignment" ADD CONSTRAINT "BoothAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VendorApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTimeline" ADD CONSTRAINT "EventTimeline_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityFeedItem" ADD CONSTRAINT "ActivityFeedItem_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VendorApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDocument" ADD CONSTRAINT "VendorDocument_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "VendorPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesEvent" ADD CONSTRAINT "SeriesEvent_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorPassportId_fkey" FOREIGN KEY ("vendorPassportId") REFERENCES "VendorPassport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSplit" ADD CONSTRAINT "PaymentSplit_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSplit" ADD CONSTRAINT "PaymentSplit_payeeAccountId_fkey" FOREIGN KEY ("payeeAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "VendorPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsOrganization" ADD CONSTRAINT "OpsOrganization_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsContact" ADD CONSTRAINT "OpsContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "OpsOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationEventProfile" ADD CONSTRAINT "OrganizationEventProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "OpsOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachActivity" ADD CONSTRAINT "OutreachActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "OpsOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachActivity" ADD CONSTRAINT "OutreachActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "OpsContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;


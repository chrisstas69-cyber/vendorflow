CREATE TABLE "PublicEventListing" (
  "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL, "endDate" TIMESTAMP(3), "timeLabel" TEXT,
  "venueName" TEXT NOT NULL, "streetAddress" TEXT, "city" TEXT NOT NULL, "state" TEXT NOT NULL,
  "postalCode" TEXT, "description" TEXT NOT NULL DEFAULT '', "category" TEXT NOT NULL, "imageUrl" TEXT,
  "organizerName" TEXT NOT NULL, "organizerEmail" TEXT, "sourceName" TEXT NOT NULL, "sourceUrl" TEXT,
  "vendorApplicationUrl" TEXT, "vendorDeadline" TIMESTAMP(3), "boothFeeCents" INTEGER,
  "vendorDetails" TEXT NOT NULL DEFAULT '{}', "status" TEXT NOT NULL DEFAULT 'pending',
  "trustStatus" TEXT NOT NULL DEFAULT 'public_source', "lastVerifiedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "claimedByEmail" TEXT,
  "manageToken" TEXT, "submissionId" TEXT, CONSTRAINT "PublicEventListing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventSubmission" (
  "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "email" TEXT NOT NULL, "verificationToken" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'awaiting_verification',
  "payloadJson" TEXT NOT NULL, "duplicateOfId" TEXT, "moderationNote" TEXT, "listingId" TEXT,
  CONSTRAINT "EventSubmission_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventClaim" (
  "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "listingId" TEXT, "externalEventId" TEXT, "eventName" TEXT, "email" TEXT NOT NULL,
  "role" TEXT, "evidenceUrl" TEXT, "note" TEXT, "status" TEXT NOT NULL DEFAULT 'pending',
  CONSTRAINT "EventClaim_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventCorrection" (
  "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "listingId" TEXT, "externalEventId" TEXT, "eventName" TEXT, "email" TEXT, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'open',
  CONSTRAINT "EventCorrection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VendorDigestSubscription" (
  "id" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "email" TEXT NOT NULL, "regions" TEXT NOT NULL DEFAULT '[]',
  "categories" TEXT NOT NULL DEFAULT '[]', "active" BOOLEAN NOT NULL DEFAULT true, "lastSentAt" TIMESTAMP(3), "unsubscribeToken" TEXT,
  CONSTRAINT "VendorDigestSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicEventListing_slug_key" ON "PublicEventListing"("slug");
CREATE UNIQUE INDEX "PublicEventListing_manageToken_key" ON "PublicEventListing"("manageToken");
CREATE UNIQUE INDEX "PublicEventListing_submissionId_key" ON "PublicEventListing"("submissionId");
CREATE INDEX "PublicEventListing_status_startDate_idx" ON "PublicEventListing"("status", "startDate");
CREATE INDEX "PublicEventListing_city_state_startDate_idx" ON "PublicEventListing"("city", "state", "startDate");
CREATE INDEX "PublicEventListing_category_startDate_idx" ON "PublicEventListing"("category", "startDate");
CREATE UNIQUE INDEX "EventSubmission_verificationToken_key" ON "EventSubmission"("verificationToken");
CREATE INDEX "EventSubmission_status_createdAt_idx" ON "EventSubmission"("status", "createdAt");
CREATE INDEX "EventSubmission_email_idx" ON "EventSubmission"("email");
CREATE INDEX "EventClaim_status_createdAt_idx" ON "EventClaim"("status", "createdAt");
CREATE INDEX "EventClaim_listingId_idx" ON "EventClaim"("listingId");
CREATE INDEX "EventCorrection_status_createdAt_idx" ON "EventCorrection"("status", "createdAt");
CREATE INDEX "EventCorrection_listingId_idx" ON "EventCorrection"("listingId");
CREATE UNIQUE INDEX "VendorDigestSubscription_email_key" ON "VendorDigestSubscription"("email");
CREATE UNIQUE INDEX "VendorDigestSubscription_unsubscribeToken_key" ON "VendorDigestSubscription"("unsubscribeToken");
CREATE INDEX "VendorDigestSubscription_active_lastSentAt_idx" ON "VendorDigestSubscription"("active", "lastSentAt");
ALTER TABLE "EventSubmission" ADD CONSTRAINT "EventSubmission_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PublicEventListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventClaim" ADD CONSTRAINT "EventClaim_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PublicEventListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCorrection" ADD CONSTRAINT "EventCorrection_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PublicEventListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

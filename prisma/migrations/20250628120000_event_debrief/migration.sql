-- CreateTable
CREATE TABLE "EventDebrief" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorPassportId" TEXT,
    "vendorEmail" TEXT NOT NULL,
    "eventId" TEXT,
    "applicationId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "notes" TEXT NOT NULL DEFAULT '',
    "issues" TEXT NOT NULL DEFAULT '',
    "bringNextTime" TEXT NOT NULL DEFAULT '',
    "missedOpportunities" TEXT NOT NULL DEFAULT '',
    "topSellers" TEXT NOT NULL DEFAULT '',
    "crowdRating" INTEGER,
    "weatherSummary" TEXT,
    "weatherHighF" INTEGER,
    "weatherLowF" INTEGER,
    "weatherPrecipPct" INTEGER,
    "weatherCondition" TEXT,
    "checklistJson" TEXT NOT NULL DEFAULT '[]',
    "grossSalesCents" INTEGER,
    "expensesCents" INTEGER,
    "netProfitCents" INTEGER,
    "marginBps" INTEGER,
    "breakEvenHour" TEXT,
    "bestHour" TEXT,
    "cashPercent" INTEGER,
    "cardPercent" INTEGER,
    "financialId" TEXT,

    CONSTRAINT "EventDebrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventDebrief_vendorEmail_eventName_eventDate_key" ON "EventDebrief"("vendorEmail", "eventName", "eventDate");

-- CreateIndex
CREATE INDEX "EventDebrief_vendorEmail_eventDate_idx" ON "EventDebrief"("vendorEmail", "eventDate");

-- CreateIndex
CREATE INDEX "EventDebrief_vendorPassportId_idx" ON "EventDebrief"("vendorPassportId");

-- AddForeignKey
ALTER TABLE "EventDebrief" ADD CONSTRAINT "EventDebrief_vendorPassportId_fkey" FOREIGN KEY ("vendorPassportId") REFERENCES "VendorPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

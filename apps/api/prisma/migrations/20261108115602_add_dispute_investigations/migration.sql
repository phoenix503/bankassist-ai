-- CreateTable
CREATE TABLE "DisputeInvestigation" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeInvestigation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeInvestigation_disputeId_createdAt_idx" ON "DisputeInvestigation"("disputeId", "createdAt");

-- AddForeignKey
ALTER TABLE "DisputeInvestigation" ADD CONSTRAINT "DisputeInvestigation_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

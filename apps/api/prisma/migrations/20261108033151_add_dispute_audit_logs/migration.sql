-- CreateEnum
CREATE TYPE "AuditActorRole" AS ENUM ('CUSTOMER', 'SUPPORT_AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "DisputeAuditLog" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "previousStatus" "DisputeStatus",
    "newStatus" "DisputeStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" "AuditActorRole" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisputeAuditLog_disputeId_createdAt_idx" ON "DisputeAuditLog"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "DisputeAuditLog_actorId_idx" ON "DisputeAuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "DisputeAuditLog" ADD CONSTRAINT "DisputeAuditLog_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

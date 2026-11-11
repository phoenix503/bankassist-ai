/*
  Warnings:

  - You are about to drop the column `transactionId` on the `Dispute` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_transactionId_fkey";

-- DropIndex
DROP INDEX "Dispute_transactionId_key";

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "transactionId";

-- CreateTable
CREATE TABLE "DisputeTransaction" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "DisputeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisputeTransaction_transactionId_key" ON "DisputeTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "DisputeTransaction_disputeId_idx" ON "DisputeTransaction"("disputeId");

-- AddForeignKey
ALTER TABLE "DisputeTransaction" ADD CONSTRAINT "DisputeTransaction_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeTransaction" ADD CONSTRAINT "DisputeTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

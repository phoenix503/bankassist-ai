-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
-- CreateTable
CREATE TABLE "policy_chunks" (
    "id" UUID NOT NULL,
    "chunkId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(768) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policy_chunks_chunkId_key" ON "policy_chunks"("chunkId");

-- CreateIndex
CREATE INDEX "policy_chunks_documentId_idx" ON "policy_chunks"("documentId");


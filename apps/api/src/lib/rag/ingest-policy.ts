
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

import { loadPolicyDocuments } from "./document-loader";
import { splitIntoChunks } from "./text-chunker";
import { generateDocumentEmbedding } from "./embeddings";

type EmbeddedChunk = {
  chunk: ReturnType<typeof splitIntoChunks>[number];
  embedding: number[];
};

export async function ingestPolicyDocuments() {
  const documents = await loadPolicyDocuments();

  let insertedCount = 0;
  let deletedCount = 0;
  let failedCount = 0;

  const failedDocuments: string[] = [];
  let totalChunks = 0;

  for (const document of documents) {
    const chunks = splitIntoChunks(document);

    totalChunks += chunks.length;

    if (chunks.length === 0) {
      console.warn(
        `Skipping document with no chunks: ${document.documentId}`
      );
      continue;
    }

    try {
      // 1. Generate every embedding before modifying the database.
      const embeddedChunks: EmbeddedChunk[] = [];

      for (const chunk of chunks) {
        const embedding = await generateDocumentEmbedding(
          chunk.content
        );

        embeddedChunks.push({
          chunk,
          embedding,
        });
      }

      // 2. Replace/update chunks and remove stale chunks atomically.
      const deletedForDocument = await prisma.$transaction(
        async (tx) => {
          for (const item of embeddedChunks) {
            const { chunk, embedding } = item;

            const vectorString = `[${embedding.join(",")}]`;

            await tx.$executeRaw`
              INSERT INTO policy_chunks (
                id,
                "chunkId",
                "documentId",
                title,
                source,
                content,
                "chunkIndex",
                embedding,
                "createdAt"
              )
              VALUES (
                ${randomUUID()}::uuid,
                ${chunk.chunkId},
                ${chunk.documentId},
                ${chunk.title},
                ${chunk.source},
                ${chunk.content},
                ${chunk.chunkIndex},
                ${vectorString}::vector,
                NOW()
              )
              ON CONFLICT ("chunkId")
              DO UPDATE SET
                "documentId" = EXCLUDED."documentId",
                title = EXCLUDED.title,
                source = EXCLUDED.source,
                content = EXCLUDED.content,
                "chunkIndex" = EXCLUDED."chunkIndex",
                embedding = EXCLUDED.embedding,
                "createdAt" = NOW()
            `;
          }

          const currentChunkIds = embeddedChunks.map(
            ({ chunk }) => chunk.chunkId
          );

          // Remove old chunks that are no longer generated.
          const deleted = await tx.$executeRaw`
            DELETE FROM policy_chunks
            WHERE "documentId" = ${document.documentId}
              AND "chunkId" NOT IN (${Prisma.join(currentChunkIds)})
          `;

          return deleted;
        }
      );

      insertedCount += chunks.length;
      deletedCount += deletedForDocument;

      console.log(
        `Successfully ingested ${document.documentId}: ` +
        `${chunks.length} chunks, ${deletedForDocument} stale chunks removed`
      );
    } catch (error) {
      failedCount += chunks.length;
      failedDocuments.push(document.documentId);

      console.error(
        `Failed to ingest document ${document.documentId}:`,
        error
      );
    }
  }

  return {
    totalDocuments: documents.length,
    totalChunks,
    insertedCount,
    deletedCount,
    failedCount,
    failedDocuments,
  };
}

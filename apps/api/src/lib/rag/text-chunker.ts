
import type { PolicyDocument } from "./document-loader";

export type PolicyChunk = {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  content: string;
  chunkIndex: number;
};

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

export function splitIntoChunks(
  document: PolicyDocument
): PolicyChunk[] {
  const text = document.content
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks: PolicyChunk[] = [];

  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Prefer ending at a paragraph boundary.
    if (end < text.length) {
      const boundary = text.lastIndexOf(
        "\n\n",
        end
      );

      // Avoid creating very small chunks.
      if (boundary > start + CHUNK_SIZE / 2) {
        end = boundary;
      }
    }

    const content = text.slice(start, end).trim();

    if (content) {
      const chunkIndex = chunks.length;

      chunks.push({
        chunkId: `${document.documentId}-${chunkIndex}`,
        documentId: document.documentId,
        title: document.title,
        source: document.source,
        content,
        chunkIndex,
      });
    }

    if (end >= text.length) {
      break;
    }

    // Move forward while retaining overlap.
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  return chunks;
}

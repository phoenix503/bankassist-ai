
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generateQueryEmbedding } from "./embeddings";

export type PolicySearchResult = {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  content: string;
  chunkIndex: number;
  similarity: number;
};

const RETRIEVAL_LIMIT = 10;
const RRF_K = 60;

type SearchRow = {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  content: string;
  chunkIndex: number;
};

type VectorSearchRow = SearchRow & {
  distance: number;
};

function reciprocalRankFusion(
  vectorResults: SearchRow[],
  keywordResults: SearchRow[]
): Map<string, number> {
  const scores = new Map<string, number>();

  function addScores(results: SearchRow[]) {
    results.forEach((result, index) => {
      const rank = index + 1;

      const score =
        1 / (RRF_K + rank);

      scores.set(
        result.chunkId,
        (scores.get(result.chunkId) ?? 0) + score
      );
    });
  }

  addScores(vectorResults);
  addScores(keywordResults);

  return scores;
}

export async function searchPolicies(
  query: string,
  topK = 3
): Promise<PolicySearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error("topK must be a positive integer");
  }

  // 1. Generate query embedding.
  const embedding = await generateQueryEmbedding(query);

  const vectorString = `[${embedding.join(",")}]`;

  // 2. Run vector and keyword searches in parallel.
  const [vectorResults, keywordResults] = await Promise.all([
    prisma.$queryRaw<VectorSearchRow[]>`
      SELECT
        "chunkId",
        "documentId",
        title,
        source,
        content,
        "chunkIndex",
        (embedding <=> ${vectorString}::vector)::float8 AS distance
      FROM policy_chunks
      ORDER BY embedding <=> ${vectorString}::vector
      LIMIT ${RETRIEVAL_LIMIT}
    `,

    prisma.$queryRaw<SearchRow[]>`
      SELECT
        "chunkId",
        "documentId",
        title,
        source,
        content,
        "chunkIndex"
      FROM policy_chunks
      WHERE
        to_tsvector(
          'english',
          COALESCE(title, '') || ' ' || content
        )
        @@ websearch_to_tsquery('english', ${query})
      ORDER BY
        ts_rank_cd(
          to_tsvector(
            'english',
            COALESCE(title, '') || ' ' || content
          ),
          websearch_to_tsquery('english', ${query})
        ) DESC
      LIMIT ${RETRIEVAL_LIMIT}
    `,
  ]);

  // 3. Combine both result sets without duplicates.
  const candidates = new Map<string, SearchRow>();

  for (const result of vectorResults) {
    candidates.set(result.chunkId, result);
  }

  for (const result of keywordResults) {
    candidates.set(result.chunkId, result);
  }

  if (candidates.size === 0) {
    return [];
  }

  // 4. Calculate RRF scores.
  const fusionScores = reciprocalRankFusion(
    vectorResults,
    keywordResults
  );

  // 5. Calculate cosine similarity for every candidate.
  // This preserves the existing similarity threshold behavior.
  const chunkIds = Array.from(candidates.keys());

  const similarityResults = await prisma.$queryRaw<
    Array<{
      chunkId: string;
      similarity: number;
    }>
  >`
    SELECT
      "chunkId",
      (
        1 - (embedding <=> ${vectorString}::vector)
      )::float8 AS similarity
    FROM policy_chunks
    WHERE "chunkId" IN (${Prisma.join(chunkIds)})
  `;

  const similarityMap = new Map(
    similarityResults.map((result) => [
      result.chunkId,
      Number(result.similarity.toFixed(4)),
    ])
  );

  // 6. Sort by fused relevance and return top K.
  return Array.from(candidates.values())
    .map((result) => ({
      ...result,
      similarity: similarityMap.get(result.chunkId) ?? 0,
    }))
    .sort((a, b) => {
      const scoreDifference =
        (fusionScores.get(b.chunkId) ?? 0) -
        (fusionScores.get(a.chunkId) ?? 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return b.similarity - a.similarity;
    })
    .slice(0, topK);
}

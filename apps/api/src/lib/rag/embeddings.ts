
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is missing");
}

const ai = new GoogleGenAI({
  apiKey,
});

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export async function generateDocumentEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Invalid embedding returned by Gemini");
  }

  return embedding;
}

export async function generateQueryEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Invalid query embedding returned by Gemini");
  }

  return embedding;
}

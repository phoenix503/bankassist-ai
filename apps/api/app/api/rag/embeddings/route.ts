
import { NextResponse } from "next/server";

import {
  generateDocumentEmbedding,
  generateQueryEmbedding,
} from "@/lib/rag/embeddings";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body.text !== "string" ||
      body.text.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Text is required" },
        { status: 400 }
      );
    }

    const documentEmbedding =
      await generateDocumentEmbedding(body.text);

    const queryEmbedding =
      await generateQueryEmbedding(body.text);

    return NextResponse.json({
      success: true,
      model: "gemini-embedding-001",
      dimensions: documentEmbedding.length,
      documentEmbeddingPreview: documentEmbedding.slice(0, 5),
      queryEmbeddingPreview: queryEmbedding.slice(0, 5),
    });
  } catch (error) {
    console.error("Embedding generation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Embedding generation failed",
      },
      { status: 500 }
    );
  }
}

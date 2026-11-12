
import { NextResponse } from "next/server";
import { ingestPolicyDocuments } from "@/lib/rag/ingest-policy";

/** Ingests the local policy documents into the searchable policy store. */
export async function POST() {
  try {
    const result = await ingestPolicyDocuments();

    return NextResponse.json({
      success: result.failedCount === 0,
      message: "Policy ingestion completed",
      data: result,
    });
  } catch (error) {
    console.error("Policy ingestion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Policy ingestion failed",
      },
      { status: 500 }
    );
  }
}

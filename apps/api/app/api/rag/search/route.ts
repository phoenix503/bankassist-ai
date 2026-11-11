
import { NextResponse } from "next/server";
import { z } from "zod";

import { searchPolicies } from "@/lib/rag/search-policy";

const requestSchema = z.object({
  query: z.string().min(5).max(2000),
  topK: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { query, topK = 3 } = validation.data;

    const results = await searchPolicies(query, topK);

    return NextResponse.json({
      success: true,
      query,
      totalResults: results.length,
      results,
    });
  } catch (error) {
    console.error("Policy search failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Policy search failed",
      },
      { status: 500 }
    );
  }
}

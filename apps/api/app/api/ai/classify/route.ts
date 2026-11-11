
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { classifyBankingQuery } from "@/lib/ai/classifier";

// Request validation schema
const requestSchema = z.object({
  message: z.string().min(5).max(2000),
});

export async function POST(request: NextRequest) {
  // 1. Parse request body
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON" },
      { status: 400 }
    );
  }

  // 2. Validate request
  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  // 3. Classify banking query using Gemini
  try {
    const result = await classifyBankingQuery(
      validation.data.message
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI classification failed:", error);

    return NextResponse.json(
      {
        error: "AI classification failed",
      },
      { status: 500 }
    );
  }
}

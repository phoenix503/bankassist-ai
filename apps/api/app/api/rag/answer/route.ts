
import { NextResponse } from "next/server";
import { z } from "zod";

import { answerPolicyQuestion } from "@/lib/rag/answer-policy";

const requestSchema = z.object({
  query: z.string().min(5).max(2000),
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

    const result = await answerPolicyQuestion(
      validation.data.query
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Policy answer generation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Policy answer generation failed",
      },
      { status: 500 }
    );
  }
}

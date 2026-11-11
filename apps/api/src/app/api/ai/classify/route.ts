import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geminiModel } from "../../../../lib/ai/gemini";

const requestSchema = z.object({
  message: z.string().min(5).max(2000),
});

const responseSchema = z.object({
  category: z.enum([
    "FAILED_TRANSACTION",
    "DUPLICATE_TRANSACTION",
    "UNRECOGNIZED_TRANSACTION",
    "GENERAL_BANKING",
  ]),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  requiresInvestigation: z.boolean(),
  explanation: z.string(),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON" },
      { status: 400 }
    );
  }

  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.issues },
      { status: 400 }
    );
  }

  try {
    const structuredModel = geminiModel.withStructuredOutput(
      responseSchema,
      { name: "banking_intent_classification" }
    );

    const result = await structuredModel.invoke([
      [
        "system",
        `You are BankAssist AI, a banking transaction intent classifier.

        Classify the customer's message into one category:

        FAILED_TRANSACTION:
        Money debited but beneficiary not credited.

        DUPLICATE_TRANSACTION:
        The same transaction appears to have been debited more than once.

        UNRECOGNIZED_TRANSACTION:
        Customer does not recognize a transaction.

        GENERAL_BANKING:
        Any other banking query.

        Set requiresInvestigation to true for the first three
        categories and false for general banking.

        Do not invent transaction details.
        Confidence is your estimated classification confidence,
        not a verified probability.

        Return only the required structured output.`
      ],
      ["human", validation.data.message],
    ]);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI classification failed:", error);

    return NextResponse.json(
      { error: "AI classification failed" },
      { status: 500 }
    );
  }

}

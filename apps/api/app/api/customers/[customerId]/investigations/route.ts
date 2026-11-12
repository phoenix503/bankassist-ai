
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { graph } from "@/lib/agents/investigation.graph";
import {
  investigationResultSchema,
} from "@/lib/ai/investigation.schema";

const requestSchema = z.object({
  message: z.string().min(5).max(2000),
  transactionReference: z.string().min(1).optional(),
});

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

/** Validates a customer inquiry, runs the investigation graph, and returns validated findings. */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Get customer ID from dynamic route
    const { customerId } = await params;

    // 2. Validate request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request",
        },
        { status: 400 }
      );
    }

    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { message, transactionReference } = validation.data;

    // 3. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    // 4. Extract transaction reference from message
    const reference =
      transactionReference ??
      message.match(/\bTXN[A-Z0-9]+\b/i)?.[0];

    // 5. Invoke LangGraph workflow
    const graphResult = await graph.invoke({
      customerId,
      message,
      transactionReference: reference,
    });

    // 6. Validate structured investigation output
    const structuredValidation =
      investigationResultSchema.safeParse(
        graphResult.structuredResult
      );

    if (!structuredValidation.success) {
      console.error(
        "Invalid structured investigation result:",
        structuredValidation.error.issues
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to generate a valid investigation result",
        },
        { status: 500 }
      );
    }

    const investigation = structuredValidation.data;
    const policyAnswer = graphResult.policyAnswer;

    // 7. Return structured and customer-facing responses
    return NextResponse.json({
      success: true,
      data: {
        // New structured investigation contract
        investigation,

        // Existing customer-facing response and citations
        response: policyAnswer
          ? {
            answer: policyAnswer.answer,
            citations: policyAnswer.citations,
            grounded: policyAnswer.grounded,
            reason: policyAnswer.reason,
            threshold: policyAnswer.threshold,
          }
          : null,

        // Preserve existing graph output for backward compatibility
        ...graphResult,
      },
    });
  } catch (error) {
    console.error("Investigation API failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to investigate transaction",
      },
      { status: 500 }
    );
  }
}

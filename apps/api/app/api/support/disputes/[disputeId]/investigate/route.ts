
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { graph } from "@/lib/agents/investigation.graph";
import { investigationResultSchema } from "@/lib/ai/investigation.schema";

type RouteContext = {
  params: Promise<{
    disputeId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { disputeId } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transactions: {
          include: {
            transaction: {
              include: {
                account: {
                  select: {
                    customerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          message: "Dispute not found.",
        },
        { status: 404 }
      );
    }

    if (dispute.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          message: "Only disputes under review can be investigated.",
        },
        { status: 409 }
      );
    }

    const transactionReferences = dispute.transactions.map(
      item => item.transaction.reference
    );

    if (transactionReferences.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No linked transactions found for this dispute.",
        },
        { status: 422 }
      );
    }

    // Verify that all linked transactions belong to this dispute's customer.
    const invalidTransaction = dispute.transactions.some(
      item => item.transaction.account.customerId !== dispute.customerId
    );

    if (invalidTransaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid transaction ownership detected.",
        },
        { status: 403 }
      );
    }

    // Build investigation message from trusted dispute data.
    const message = `
      Complaint category: ${dispute.reason}
      Customer complaint: ${dispute.description}
      Investigate the linked transactions and provide findings,
      evidence assessment, missing information and suggested
      next action for the support agent.
    `.trim();

    const graphResult = await graph.invoke({
      customerId: dispute.customerId,
      message,
      transactionReferences,
    });

    const validation = investigationResultSchema.safeParse(
      graphResult.structuredResult
    );

    if (!validation.success) {
      console.error(
        "Invalid support investigation result:",
        validation.error.issues
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to generate a valid investigation report.",
        },
        { status: 500 }
      );
    }

    // Recheck dispute status before saving the report.
    const currentDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { status: true },
    });

    if (!currentDispute || currentDispute.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          message: "Dispute status changed. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    // Persist each investigation as a separate report version.
    const savedInvestigation =
      await prisma.disputeInvestigation.create({
        data: {
          disputeId,

          report: JSON.parse(
            JSON.stringify(validation.data)
          ) as Prisma.InputJsonValue,

          policyAnswer: graphResult.policyAnswer
            ? (JSON.parse(
              JSON.stringify(graphResult.policyAnswer)
            ) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

    return NextResponse.json({
      success: true,
      message: "Support investigation completed and saved.",
      data: {
        disputeId: dispute.id,
        disputeReference: dispute.disputeReference,
        reportId: savedInvestigation.id,
        createdAt: savedInvestigation.createdAt,
        investigation: validation.data,
        policyAnswer: graphResult.policyAnswer ?? null,
      },
    });
  } catch (error) {
    console.error("Support investigation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete support investigation.",
      },
      { status: 500 }
    );
  }
}


export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { disputeId } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        disputeReference: true,
        status: true,
        investigations: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            report: true,
            policyAnswer: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        {
          success: false,
          message: "Dispute not found.",
        },
        { status: 404 }
      );
    }

    const latestInvestigation = dispute.investigations[0] ?? null;

    return NextResponse.json({
      success: true,
      message: latestInvestigation
        ? "Latest investigation retrieved successfully."
        : "No investigation report found for this dispute.",
      data: {
        disputeId: dispute.id,
        disputeReference: dispute.disputeReference,
        status: dispute.status,
        investigation: latestInvestigation
          ? {
            reportId: latestInvestigation.id,
            createdAt: latestInvestigation.createdAt,
            report: latestInvestigation.report,
            policyAnswer: latestInvestigation.policyAnswer,
          }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve investigation:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve investigation report.",
      },
      { status: 500 }
    );
  }
}

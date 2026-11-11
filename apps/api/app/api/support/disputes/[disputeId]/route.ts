
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ disputeId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { disputeId } = await context.params;

    const dispute = await prisma.dispute.findUnique({
      where: {
        id: disputeId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: {
          include: {
            transaction: {
              include: {
                account: {
                  select: {
                    accountNumber: true,
                    accountType: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: "asc",
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

    const transactions = dispute.transactions.map(
      (association) => {
        const transaction = association.transaction;

        return {
          reference: transaction.reference,
          amount: transaction.amount.toString(),
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
          beneficiaryName: transaction.beneficiaryName,
          beneficiaryRef: transaction.beneficiaryRef,
          account: transaction.account,
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        id: dispute.id,
        disputeReference: dispute.disputeReference,
        reason: dispute.reason,
        description: dispute.description,
        status: dispute.status,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,

        customer: dispute.customer,

        transactionReferences: transactions.map(
          (transaction) => transaction.reference
        ),

        transactions,

        // Backward compatibility for the existing support UI.
        transaction: transactions[0] ?? null,

        auditHistory: dispute.auditLogs.map((log) => ({
          id: log.id,
          previousStatus: log.previousStatus,
          newStatus: log.newStatus,
          actorId: log.actorId,
          actorRole: log.actorRole,
          note: log.note,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get support dispute details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve dispute details.",
      },
      { status: 500 }
    );
  }
}

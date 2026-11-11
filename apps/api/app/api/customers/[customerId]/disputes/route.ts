
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ customerId: string }>;
};

const disputeSchema = z
  .object({
    transactionReference: z.string().min(1).optional(),
    transactionReferences: z
      .array(z.string().min(1))
      .min(1)
      .max(10)
      .optional(),
    reason: z.enum([
      "FAILED_TRANSACTION",
      "DUPLICATE_TRANSACTION",
      "UNRECOGNIZED_TRANSACTION",
      "OTHER",
    ]),
    description: z.string().trim().min(10).max(2000),
    customerConfirmation: z.literal(true),
  })
  .superRefine((data, ctx) => {
    const references = [
      ...(data.transactionReferences ?? []),
      ...(data.transactionReference
        ? [data.transactionReference]
        : []),
    ];

    if (references.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one transaction reference is required.",
        path: ["transactionReferences"],
      });
    }

    if (new Set(references).size !== references.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate transaction references are not allowed.",
        path: ["transactionReferences"],
      });
    }

    if (
      data.reason === "DUPLICATE_TRANSACTION" &&
      references.length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least two transaction references are required for a duplicate transaction dispute.",
        path: ["transactionReferences"],
      });
    }
  });

function generateDisputeReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `DSP-${date}-${suffix}`;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { customerId } = await context.params;
    const body = await request.json();

    const validation = disputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid dispute submission.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      transactionReference,
      transactionReferences,
      reason,
      description,
    } = validation.data;

    // Support both the legacy single-reference and new array formats.
    const references = [
      ...(transactionReferences ?? []),
      ...(transactionReference ? [transactionReference] : []),
    ];

    // Verify customer.
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    // Retrieve all requested transactions belonging to this customer.
    const transactions = await prisma.transaction.findMany({
      where: {
        reference: { in: references },
        account: { customerId },
      },
      include: {
        account: {
          select: {
            accountNumber: true,
            currency: true,
          },
        },
      },
    });

    if (transactions.length !== references.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more transactions were not found for this customer.",
        },
        { status: 404 }
      );
    }

    // Only debit transactions can be disputed.
    const nonDebitTransaction = transactions.find(
      (transaction) => transaction.type !== "DEBIT"
    );

    if (nonDebitTransaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Only debit transactions can be disputed.",
          transactionReference: nonDebitTransaction.reference,
        },
        { status: 400 }
      );
    }

    // Check whether any selected transaction already belongs to a dispute.
    const existingAssociations =
      await prisma.disputeTransaction.findMany({
        where: {
          transactionId: {
            in: transactions.map((transaction) => transaction.id),
          },
        },
        include: {
          dispute: {
            select: {
              disputeReference: true,
            },
          },
        },
      });

    if (existingAssociations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A dispute already exists for one or more selected transactions.",
          existingDisputeReferences: [
            ...new Set(
              existingAssociations.map(
                (association) =>
                  association.dispute.disputeReference
              )
            ),
          ],
        },
        { status: 409 }
      );
    }

    // Explicit customer confirmation is mandatory.
    // Zod already validates customerConfirmation as literal true.

    // Create one dispute and associate all selected transactions atomically.
    const dispute = await prisma.dispute.create({
      data: {
        disputeReference: generateDisputeReference(),
        reason,
        description,
        status: "OPEN",
        customerId,
        transactions: {
          create: transactions.map((transaction) => ({
            transactionId: transaction.id,
          })),
        },
      },
      include: {
        transactions: {
          include: {
            transaction: {
              include: {
                account: {
                  select: {
                    accountNumber: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const associatedTransactions = dispute.transactions.map(
      (association) => association.transaction
    );

    return NextResponse.json(
      {
        success: true,
        message: "Dispute submitted successfully.",
        data: {
          disputeReference: dispute.disputeReference,
          transactionReferences: associatedTransactions.map(
            (transaction) => transaction.reference
          ),
          // Legacy field for existing single-transaction consumers.
          transactionReference:
            associatedTransactions.length === 1
              ? associatedTransactions[0].reference
              : null,
          transactions: associatedTransactions.map((transaction) => ({
            reference: transaction.reference,
            amount: transaction.amount.toString(),
            type: transaction.type,
            status: transaction.status,
            description: transaction.description,
            createdAt: transaction.createdAt,
            accountNumber: transaction.account.accountNumber,
            currency: transaction.account.currency,
          })),
          reason: dispute.reason,
          status: dispute.status,
          createdAt: dispute.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle concurrent submissions.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A dispute already exists for one or more selected transactions.",
        },
        { status: 409 }
      );
    }

    console.error("Dispute submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit dispute.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { customerId } = await context.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const disputes = await prisma.dispute.findMany({
      where: { customerId },
      include: {
        transactions: {
          include: {
            transaction: {
              select: {
                reference: true,
                amount: true,
                type: true,
                status: true,
                description: true,
                createdAt: true,
                account: {
                  select: {
                    accountNumber: true,
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = disputes.map((dispute) => {
      const associatedTransactions = dispute.transactions.map(
        (association) => association.transaction
      );

      const formattedTransactions = associatedTransactions.map(
        (transaction) => ({
          reference: transaction.reference,
          amount: transaction.amount.toString(),
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt,
          accountNumber: transaction.account.accountNumber,
          currency: transaction.account.currency,
        })
      );

      return {
        id: dispute.id,
        disputeReference: dispute.disputeReference,
        reason: dispute.reason,
        description: dispute.description,
        status: dispute.status,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        transactionReferences: formattedTransactions.map(
          (transaction) => transaction.reference
        ),
        transactions: formattedTransactions,
        // Legacy field for existing frontend consumers.
        transaction: formattedTransactions[0] ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
      },
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Get disputes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve disputes.",
      },
      { status: 500 }
    );
  }
}

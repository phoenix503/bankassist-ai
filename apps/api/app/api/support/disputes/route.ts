
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const querySchema = z.object({
  status: z
    .enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"])
    .optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );

    const validation = querySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid dispute queue filters.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { status, search, page, pageSize } = validation.data;

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
          OR: [
            {
              disputeReference: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              transactions: {
                some: {
                  transaction: {
                    reference: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            },
            {
              customer: {
                is: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
        : {}),
    };

    const [total, disputes] = await prisma.$transaction([
      prisma.dispute.count({ where }),
      prisma.dispute.findMany({
        where,
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
          _count: {
            select: {
              auditLogs: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data = disputes.map((dispute) => {
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
            accountNumber: transaction.account.accountNumber,
            currency: transaction.account.currency,
          };
        }
      );

      return {
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

        // Backward compatibility with the existing support queue UI.
        transaction: transactions[0] ?? null,

        auditLogCount: dispute._count.auditLogs,
      };
    });

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        status: status ?? null,
        search: search ?? null,
      },
      data,
    });
  } catch (error) {
    console.error("Support dispute queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve support dispute queue.",
      },
      { status: 500 }
    );
  }
}

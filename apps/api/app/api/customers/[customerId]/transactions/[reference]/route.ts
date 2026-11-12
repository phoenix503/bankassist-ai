
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

/** Returns the customer's account summaries and transactions (currently unfiltered by reference). */
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { customerId } = await params;

    const accounts = await prisma.account.findMany({
      where: { customerId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, message: "No accounts found" },
        { status: 404 }
      );
    }

    const accountSummaries = accounts.map((account) => ({
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      balance: account.balance.toString(),
    }));

    const transactions = accounts.flatMap((account) =>
      account.transactions.map((transaction) => ({
        ...transaction,
        amount: transaction.amount.toString(),
        accountNumber: account.accountNumber,
        currency: account.currency,
      }))
    );

    return NextResponse.json({
      success: true,
      accounts: accountSummaries,
      total: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Transaction retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve transactions",
      },
      { status: 500 }
    );
  }
}

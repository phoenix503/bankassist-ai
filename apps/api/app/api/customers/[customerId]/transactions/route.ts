
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    console.log("Route params:", params);

    const { customerId } = await params;

    console.log("Customer ID:", customerId);

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

    const transactions = accounts.flatMap((account) =>
      account.transactions.map((transaction) => ({
        ...transaction,
        amount: transaction.amount.toString(),
        accountNumber: account.accountNumber,
      }))
    );

    return NextResponse.json({
      success: true,
      total: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Transaction retrieval failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve transactions" },
      { status: 500 }
    );
  }
}

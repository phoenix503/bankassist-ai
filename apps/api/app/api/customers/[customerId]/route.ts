import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ customerId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { customerId } = await params;

    if (!customerId?.trim()) {
      return NextResponse.json(
        { success: false, message: "Customer ID is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            currency: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        accounts: customer.accounts.map((account) => ({
          ...account,
          balance: account.balance.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve customer details." },
      { status: 500 }
    );
  }
}
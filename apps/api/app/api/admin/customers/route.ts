
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const createCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(255),

  mobile: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid mobile number."),

  accountNumber: z.string().trim().min(5).max(30),

  accountType: z.enum(["SAVINGS", "CURRENT"]),

  balance: z
    .string()
    .regex(
      /^(0|[1-9]\d{0,12})(\.\d{1,2})?$/,
      "Balance must be a valid non-negative amount with up to 2 decimal places."
    ),

  currency: z.string().trim().length(3).default("INR"),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must contain valid JSON.",
        },
        { status: 400 }
      );
    }

    const validation = createCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid customer details.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      mobile,
      accountNumber,
      accountType,
      balance,
      currency,
    } = validation.data;

    // Create customer and first account atomically.
    const customer = await prisma.customer.create({
      data: {
        name,
        email: email.toLowerCase(),
        mobile,
        accounts: {
          create: {
            accountNumber,
            accountType,
            balance,
            currency: currency.toUpperCase(),
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    const account = customer.accounts[0];

    return NextResponse.json(
      {
        success: true,
        message: "Customer and bank account created successfully.",
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            mobile: customer.mobile,
            createdAt: customer.createdAt,
          },
          account: {
            id: account.id,
            accountNumber: account.accountNumber,
            accountType: account.accountType,
            balance: account.balance.toString(),
            currency: account.currency,
            createdAt: account.createdAt,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle duplicate unique fields.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target =
        "meta" in error &&
          typeof error.meta === "object" &&
          error.meta !== null &&
          "target" in error.meta
          ? String(error.meta.target)
          : "";

      let message = "A customer or account with these details already exists.";

      if (target.includes("email")) {
        message = "A customer with this email already exists.";
      } else if (target.includes("mobile")) {
        message = "A customer with this mobile number already exists.";
      } else if (target.includes("accountNumber")) {
        message = "This account number already exists.";
      }

      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 409 }
      );
    }

    console.error("Create customer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create customer.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize")) || 10)
    );

    const where = search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search } },
          {
            accounts: {
              some: {
                accountNumber: {
                  contains: search,
                  mode: "insensitive" as const
                }
              }
            }
          }
        ]
      }
      : {};

    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
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
              currency: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: customers.map((customer) => ({
        ...customer,
        accounts: customer.accounts.map((account) => ({
          ...account,
          balance: account.balance.toString()
        }))
      }))
    });
  } catch (error) {
    console.error("Get admin customers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve customers."
      },
      { status: 500 }
    );
  }
}
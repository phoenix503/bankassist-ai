
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Create demo customers
  const customer1 = await prisma.customer.upsert({
    where: { email: "rahul@example.com" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "rahul@example.com",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      name: "Priya Verma",
      email: "priya@example.com",
    },
  });

  // 2. Create bank accounts
  const account1 = await prisma.account.upsert({
    where: { accountNumber: "BANK100001" },
    update: {},
    create: {
      accountNumber: "BANK100001",
      accountType: "SAVINGS",
      balance: "45000.00",
      currency: "INR",
      customerId: customer1.id,
    },
  });

  const account2 = await prisma.account.upsert({
    where: { accountNumber: "BANK100002" },
    update: {},
    create: {
      accountNumber: "BANK100002",
      accountType: "CURRENT",
      balance: "125000.00",
      currency: "INR",
      customerId: customer1.id,
    },
  });

  const account3 = await prisma.account.upsert({
    where: { accountNumber: "BANK200001" },
    update: {},
    create: {
      accountNumber: "BANK200001",
      accountType: "SAVINGS",
      balance: "78000.00",
      currency: "INR",
      customerId: customer2.id,
    },
  });

  // 3. Create demo transactions
  const transactions = [
    {
      reference: "TXN1001",
      amount: "5000.00",
      type: "DEBIT" as const,
      status: "SUCCESS" as const,
      description: "Amazon online purchase",
      accountId: account1.id,
      beneficiaryName: "Amazon",
    },
    {
      reference: "TXN1002",
      amount: "12000.00",
      type: "DEBIT" as const,
      status: "PENDING" as const,
      description: "NEFT transfer to beneficiary",
      accountId: account1.id,
      beneficiaryName: "Amit Kumar",
      beneficiaryRef: "NEFT123456",
    },
    {
      reference: "TXN1003",
      amount: "2500.00",
      type: "DEBIT" as const,
      status: "SUCCESS" as const,
      description: "Restaurant payment",
      accountId: account1.id,
      beneficiaryName: "ABC Restaurant",
    },
    {
      reference: "TXN1004",
      amount: "2500.00",
      type: "DEBIT" as const,
      status: "SUCCESS" as const,
      description: "Restaurant payment",
      accountId: account1.id,
      beneficiaryName: "ABC Restaurant",
    },
    {
      reference: "TXN1005",
      amount: "15000.00",
      type: "CREDIT" as const,
      status: "SUCCESS" as const,
      description: "Salary credit",
      accountId: account1.id,
    },
    {
      reference: "TXN1006",
      amount: "3500.00",
      type: "DEBIT" as const,
      status: "FAILED" as const,
      description: "UPI transfer failed",
      accountId: account2.id,
      beneficiaryName: "Rohit Singh",
    },
    {
      reference: "TXN2001",
      amount: "8999.00",
      type: "DEBIT" as const,
      status: "SUCCESS" as const,
      description: "Unknown merchant POS transaction",
      accountId: account3.id,
      beneficiaryName: "XYZ DIGITAL SERVICES",
    },
    {
      reference: "TXN2002",
      amount: "20000.00",
      type: "CREDIT" as const,
      status: "SUCCESS" as const,
      description: "Account transfer received",
      accountId: account3.id,
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.upsert({
      where: { reference: transaction.reference },
      update: {},
      create: transaction,
    });
  }

  console.log("Demo banking data seeded successfully!");
  console.log({
    customers: 2,
    accounts: 3,
    transactions: transactions.length,
  });
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

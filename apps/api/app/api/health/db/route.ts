import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Checks database connectivity with a lightweight query. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      database: "connected",
      message: "PostgreSQL connection successful",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}

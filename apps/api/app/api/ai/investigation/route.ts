
import { NextResponse } from "next/server";
import { graph } from "@/lib/agents/investigation.graph";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await graph.invoke({
      customerId: body.customerId,
      message: body.message,
      transactionReference: body.transactionReference,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Investigation graph error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Investigation graph failed",
      },
      { status: 500 }
    );
  }
}

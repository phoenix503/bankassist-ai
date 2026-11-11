
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const noteSchema = z.object({
  actorId: z.string().trim().min(1).max(100),
  note: z.string().trim().min(5).max(2000),
});

type RouteContext = {
  params: Promise<{
    disputeId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { disputeId } = await context.params;

    const body = await request.json();
    const validation = noteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid investigation note.",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { actorId, note } = validation.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        disputeReference: true,
        status: true,
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

    if (dispute.status !== "UNDER_REVIEW") {
      return NextResponse.json(
        {
          success: false,
          message: "Investigation notes can only be added while the dispute is under review.",
        },
        { status: 409 }
      );
    }

    const auditLog = await prisma.disputeAuditLog.create({
      data: {
        disputeId: dispute.id,
        previousStatus: "UNDER_REVIEW",
        newStatus: "UNDER_REVIEW",
        actorId,
        actorRole: "SUPPORT_AGENT",
        note,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Investigation note added successfully.",
        data: {
          disputeReference: dispute.disputeReference,
          auditLog,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add investigation note failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to add investigation note.",
      },
      { status: 500 }
    );
  }
}

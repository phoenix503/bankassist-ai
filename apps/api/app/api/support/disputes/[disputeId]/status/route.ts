
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ disputeId: string }>;
};

const updateStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  actorId: z.string().trim().min(1).max(100),
  note: z.string().trim().min(5).max(2000),
});

const allowedTransitions: Record<string, string[]> = {
  OPEN: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["RESOLVED", "REJECTED"],
  RESOLVED: [],
  REJECTED: [],
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { disputeId } = await context.params;
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

    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status update.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { status, actorId, note } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        select: {
          id: true,
          disputeReference: true,
          status: true,
        },
      });

      if (!dispute) {
        throw new Error("DISPUTE_NOT_FOUND");
      }

      const allowed = allowedTransitions[dispute.status] ?? [];

      if (!allowed.includes(status)) {
        throw new Error("INVALID_STATUS_TRANSITION");
      }

      // Conditional update prevents concurrent stale status changes.
      const updated = await tx.dispute.updateMany({
        where: {
          id: disputeId,
          status: dispute.status,
        },
        data: {
          status,
        },
      });

      if (updated.count !== 1) {
        throw new Error("CONCURRENT_STATUS_UPDATE");
      }

      const auditLog = await tx.disputeAuditLog.create({
        data: {
          disputeId,
          previousStatus: dispute.status,
          newStatus: status,
          actorId,
          actorRole: "SUPPORT_AGENT",
          note,
        },
      });

      return {
        disputeReference: dispute.disputeReference,
        previousStatus: dispute.status,
        newStatus: status,
        auditLog,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Dispute status updated successfully.",
      data: {
        disputeReference: result.disputeReference,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        auditLog: {
          id: result.auditLog.id,
          actorId: result.auditLog.actorId,
          actorRole: result.auditLog.actorRole,
          note: result.auditLog.note,
          createdAt: result.auditLog.createdAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DISPUTE_NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "Dispute not found." },
          { status: 404 }
        );
      }

      if (error.message === "INVALID_STATUS_TRANSITION") {
        return NextResponse.json(
          { success: false, message: "Invalid dispute status transition." },
          { status: 409 }
        );
      }

      if (error.message === "CONCURRENT_STATUS_UPDATE") {
        return NextResponse.json(
          {
            success: false,
            message: "Dispute status changed concurrently. Please refresh.",
          },
          { status: 409 }
        );
      }
    }

    console.error("Update dispute status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update dispute status.",
      },
      { status: 500 }
    );
  }
}

/**
 * @file apps/web/src/lib/audit.ts
 * @description Structured operational audit logging helper backed by PostgreSQL (`AuditLog`).
 */

import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { getClientIp } from "./rate-limit";

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/**
 * Records an immutable operational audit trail event without blocking caller workflows
 * when database connectivity is intentionally disabled in local fallback mode.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress: getClientIp(input.req),
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to persist audit entry:", error);
  }
}

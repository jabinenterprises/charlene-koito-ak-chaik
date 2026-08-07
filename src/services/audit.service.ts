import { prisma } from "@/lib/prisma";
import type { ActorType, AuditAction, AuditEntityType, Prisma } from "@prisma/client";

export interface LogAuditParams {
  actorType?: ActorType;
  actorId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}


type PrismaTx = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Creates an immutable AuditLog entry.
 * Can participate in an active Prisma transaction (`tx`) or default to global `prisma`.
 */
export async function createAuditLog(
  params: LogAuditParams,
  tx?: PrismaTx
) {
  const client = tx || prisma;
  const {
    actorType = "SYSTEM",
    actorId = "system",
    action,
    entityType,
    entityId = "none",
    metadata,
    ipAddress,
    userAgent,
  } = params;

  try {
    return await client.auditLog.create({
      data: {
        actorType,
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata ?? undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error] Failed to record audit log entry:", error);
    return null;
  }
}

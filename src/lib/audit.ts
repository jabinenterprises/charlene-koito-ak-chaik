import { createAuditLog, LogAuditParams } from "@/services/audit.service";

export type LogAuditInput = LogAuditParams;

/**
 * Legacy wrapper for createAuditLog.
 */
export async function logAudit(input: LogAuditInput) {
  return createAuditLog(input);
}

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface DatabaseHealth {
  connected: boolean;
}

export class HealthRepository {
  async checkDatabase(): Promise<DatabaseHealth> {
    try {
      await prisma.permission.findFirst();
      return {
        connected: true,
      };
    } catch (error: any) {
      console.error("HEALTH CHECK DB ERROR:", error?.message || error, error?.stack);
      logger.error(
        { errMessage: error?.message || String(error), errCode: error?.code, errStack: error?.stack },
        "Database connectivity check failed.",
      );

      return {
        connected: false,
      };
    }
  }
}

export const healthRepository = new HealthRepository();
import { env } from "@/config/env";
import {
  healthRepository,
} from "@/repositories/health.repository";

export interface HealthStatus {
  status: "healthy" | "degraded";
  environment: string;
  database: "connected" | "disconnected";
  uptime: number;
  timestamp: string;
}

export class HealthService {
  async getHealth(): Promise<HealthStatus> {
    const database =
      await healthRepository.checkDatabase();

    return {
      status: database.connected
        ? "healthy"
        : "degraded",

      environment: env.NODE_ENV,

      database: database.connected
        ? "connected"
        : "disconnected",

      uptime: process.uptime(),

      timestamp: new Date().toISOString(),
    };
  }

  async isReady(): Promise<boolean> {
    const database =
      await healthRepository.checkDatabase();

    return database.connected;
  }

  getLiveness() {
    return {
      status: "alive" as const,
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = new HealthService();
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { healthService } from "@/services/health.service";

export class HealthController {
  async live(): Promise<NextResponse> {
    try {
      const result = healthService.getLiveness();

      return NextResponse.json(result, {
        status: 200,
      });
    } catch (error) {
      logger.error(
        { error },
        "Unexpected liveness check failure.",
      );

      return NextResponse.json(
        {
          status: "error",
          message: "Unable to determine application liveness.",
        },
        {
          status: 500,
        },
      );
    }
  }

  async ready(): Promise<NextResponse> {
    try {
      const ready = await healthService.isReady();

      return NextResponse.json(
        {
          status: ready ? "ready" : "not_ready",
        },
        {
          status: ready ? 200 : 503,
        },
      );
    } catch (error) {
      logger.error(
        { error },
        "Unexpected readiness check failure.",
      );

      return NextResponse.json(
        {
          status: "error",
          message: "Unable to determine application readiness.",
        },
        {
          status: 500,
        },
      );
    }
  }

  async health(): Promise<NextResponse> {
    try {
      const result = await healthService.getHealth();

      return NextResponse.json(result, {
        status: result.status === "healthy" ? 200 : 503,
      });
    } catch (error) {
      logger.error(
        { error },
        "Unexpected health check failure.",
      );

      return NextResponse.json(
        {
          status: "error",
          message: "Unable to determine application health.",
        },
        {
          status: 500,
        },
      );
    }
  }
}

export const healthController = new HealthController();
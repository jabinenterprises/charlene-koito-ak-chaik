import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  logger.info("Running infrastructure verification.");

  try {
    const result = await prisma.$queryRaw<
      Array<{ current_time: Date }>
    >`SELECT CURRENT_TIMESTAMP AS current_time`;

    return NextResponse.json({
      status: "ok",
      environment: env.NODE_ENV,
      database: "connected",
      serverTime: result[0].current_time.toISOString(),
    });
  } catch (error: any) {
    console.error("DEV VERIFY DB ERROR REASON:", error?.message || String(error), "CODE:", error?.code, "STACK:", error?.stack);
    logger.error(
      { errMessage: error?.message || String(error), errCode: error?.code, errStack: error?.stack },
      "Database verification failed.",
    );

    return NextResponse.json(
      {
        status: "error",
        environment: env.NODE_ENV,
        database: "disconnected",
        errorMessage: error?.message || String(error),
        errorName: error?.name || "Error",
        errorCode: error?.code || null,
        errorStack: error?.stack || null,
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST() {
  return GET();
}
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const DEFAULT_RDS_URL =
  "postgresql://koito_admin:Password2026@kitopostgres-2.cpuq0ym6ydn3.eu-west-1.rds.amazonaws.com:5432/koito_event";

function createPoolFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl.trim());
    return new Pool({
      user: decodeURIComponent(parsed.username || "koito_admin"),
      password: decodeURIComponent(parsed.password || "Password2026"),
      host: parsed.hostname || "kitopostgres-2.cpuq0ym6ydn3.eu-west-1.rds.amazonaws.com",
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "koito_event",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  } catch {
    return new Pool({
      user: "koito_admin",
      password: "Password2026",
      host: "kitopostgres-2.cpuq0ym6ydn3.eu-west-1.rds.amazonaws.com",
      port: 5432,
      database: "koito_event",
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL || DEFAULT_RDS_URL;
    let pool = globalForPrisma.pool;
    if (!pool) {
      pool = createPoolFromUrl(databaseUrl);
      pool.on("error", (err) => {
        console.error("🔴 [PostgreSQL Pool Idle Error]:", err);
      });
      globalForPrisma.pool = pool;
    }
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["warn", "error"] });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const val = Reflect.get(client, prop);
    return typeof val === "function" ? val.bind(client) : val;
  },
});
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z.string().min(1).optional(),
  ADMIN_AUTH_SECRET: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.flatten().fieldErrors);
}

export const env = {
  ...(parsed.success ? parsed.data : {}),
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET || "",
};
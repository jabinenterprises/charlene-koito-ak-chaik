import { healthController } from "@/controllers/health.controller";

export async function GET() {
  return healthController.live();
}
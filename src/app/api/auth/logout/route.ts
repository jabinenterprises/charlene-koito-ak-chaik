import { NextResponse } from "next/server";
import { clearAdminAuthCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminAuthCookie(response);
  return response;
}

import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = requireAdminAuth(request);
  if (!admin) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, admin });
}

import { NextResponse } from "next/server";
import { verifyGuestCode } from "@/services/checkin.service";
import { createAdminToken, setAdminAuthCookie } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const result = await verifyGuestCode(code);
    if (!result.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = createAdminToken(result.id, result.name || "admin");
    const response = NextResponse.json({
      ok: true,
      admin: {
        id: result.id,
        name: result.name,
        clusterPermissions: result.clusterPermissions,
      },
    });
    setAdminAuthCookie(response, token);
    return response;
  } catch (error: any) {
    if (error.message === "INVALID_CODE") {
      return NextResponse.json({ error: "Invalid admin code" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}

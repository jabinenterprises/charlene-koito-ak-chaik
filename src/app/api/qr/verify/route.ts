import { NextResponse } from "next/server";
import { processCheckIn, verifyGuestCode } from "@/services/checkin.service";

export const dynamic = "force-dynamic";



// GET /api/qr/verify?code=XXX - Verify QR Code or PIN (Hot-reloaded)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing code", checkedIn: false }, { status: 400 });
    }

    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      const verifyUrl = new URL(request.url);
      verifyUrl.pathname = "/verify";
      return Response.redirect(verifyUrl.toString());
    }

    const result = await verifyGuestCode(code);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "INVALID_CODE") {
      return NextResponse.json({ error: "Invalid code", checkedIn: false }, { status: 404 });
    }
    return NextResponse.json({ error: error.message, checkedIn: false }, { status: 500 });
  }
}

// POST /api/qr/verify - Submit Check-In
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, delegateId } = body;

    if (!code && !delegateId) {
      return NextResponse.json({ error: "Code or Delegate ID is required" }, { status: 400 });
    }

    const result = await processCheckIn({ code, delegateId });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "INVALID_GUEST") {
      return NextResponse.json({ error: "Invalid code or guest ID" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

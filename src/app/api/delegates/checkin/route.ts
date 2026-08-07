import { NextResponse } from "next/server";
import { processCheckIn, revokeCheckIn } from "@/services/checkin.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { delegateId, code, tableId, seatNumber, action } = body;

    if (!delegateId && !code) {
      return NextResponse.json({ error: "Delegate ID or Code is required" }, { status: 400 });
    }

    if (action === "revoke" || action === "uncheckin") {
      const result = await revokeCheckIn({ delegateId, code });
      return NextResponse.json(result);
    }

    const result = await processCheckIn({ delegateId, code, tableId, seatNumber });
    return NextResponse.json(result);
  } catch (error: any) {
    const msg: string = error.message || "";
    if (msg === "INVALID_GUEST") {
      return NextResponse.json({ error: "Delegate not found" }, { status: 404 });
    }
    if (msg.startsWith("TABLE_FULL:")) {
      const parts = msg.split(":");
      const tableName = parts[1];
      const maxCap = parts[2];
      return NextResponse.json(
        { error: `Table "${tableName}" is already at full capacity (${maxCap} max).` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const delegateId = searchParams.get("delegateId") || searchParams.get("id");
    const code = searchParams.get("code");

    if (!delegateId && !code) {
      return NextResponse.json({ error: "Delegate ID or Code is required" }, { status: 400 });
    }

    const result = await revokeCheckIn({ delegateId: delegateId || undefined, code: code || undefined });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

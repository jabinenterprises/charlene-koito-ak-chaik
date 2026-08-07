import { NextResponse } from "next/server";
import {
  assignGuestToTable,
  assignGuestsToTables,
} from "@/services/seating.service";

export const dynamic = "force-dynamic";

// POST /api/seating/assign - Assign one or many guests to tables
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body.assignments)) {
      const results = await assignGuestsToTables(body.assignments);
      return NextResponse.json({ success: true, results });
    }

    const { guestId, tableId, seatNumber } = body;

    if (!guestId) {
      return NextResponse.json({ error: "guestId is required" }, { status: 400 });
    }

    const result = await assignGuestToTable({
      guestId,
      tableId: tableId ?? null,
      seatNumber: seatNumber ?? null,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    const msg: string = error.message || "";
    if (msg === "GUEST_NOT_FOUND") {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    if (msg === "TABLE_NOT_FOUND") {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    if (msg.startsWith("TABLE_FULL:")) {
      const tableName = msg.split(":")[1];
      return NextResponse.json(
        { error: `Table "${tableName}" is at full capacity.` },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

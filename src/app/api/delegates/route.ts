import { NextResponse } from "next/server";
import { createGuest, getDelegates } from "@/services/guest.service";
import { prisma } from "@/lib/prisma";
import { getDefaultEvent } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/delegates - Retrieve formatted delegate list and stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const cluster = searchParams.get("cluster") || "ALL";
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || searchParams.get("pageSize") || "10";

    const data = await getDelegates({ search, status, cluster, pageParam, limitParam });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/delegates - Create a new guest delegate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, role, cluster, clusterId, title, titleId, tableId, notes, code } = body;

    const delegate = await createGuest({ name, phone, role, cluster, clusterId, title, titleId, tableId, notes, code });
    return NextResponse.json(delegate, { status: 201 });
  } catch (error: any) {
    const msg: string = error.message || "";
    if (msg === "NAME_REQUIRED") {
      return NextResponse.json({ error: "Delegate name is required" }, { status: 400 });
    }
    if (msg.startsWith("DUPLICATE_PHONE:")) {
      const parts = msg.split(":");
      const phoneNum = parts[1];
      const fullName = parts[2];
      const qrCode = parts[3];
      return NextResponse.json(
        { error: `A delegate with phone number ${phoneNum} already exists (${fullName}, Code: ${qrCode}).` },
        { status: 400 }
      );
    }
    if (msg.startsWith("TABLE_FULL:")) {
      const tableName = msg.split(":")[1];
      return NextResponse.json(
        { error: `Table "${tableName}" is already at maximum capacity.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/delegates?resetAll=true - Clear non-admin guests
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resetAll = searchParams.get("resetAll") === "true";

    if (resetAll) {
      const event = await getDefaultEvent();
      if (!event) {
        return NextResponse.json({ error: "Database is not available yet" }, { status: 503 });
      }

      await prisma.guest.deleteMany({
        where: {
          eventId: event.id,
          pinFingerprint: { not: "A000" },
        },
      });
      return NextResponse.json({ success: true, message: "All non-admin delegates cleared." });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

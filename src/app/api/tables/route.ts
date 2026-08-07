import { NextResponse } from "next/server";
import { createTableWithSeats, getTablesWithSeating } from "@/services/seating.service";
import { prisma } from "@/lib/prisma";
import { getDefaultEvent } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/tables - Fetch all tables and assigned delegates
export async function GET() {
  try {
    const tables = await getTablesWithSeating();
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tables - Create a new dining table with seats
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, capacity, zone, description } = body;

    if (!name || !capacity) {
      return NextResponse.json(
        { error: "Both Table Name and Capacity are required." },
        { status: 400 }
      );
    }

    const parsedCapacity = parseInt(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return NextResponse.json(
        { error: "Capacity must be a positive number." },
        { status: 400 }
      );
    }

    const table = await createTableWithSeats({
      name,
      capacity: parsedCapacity,
      zone,
      description,
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tables - Delete single table or reset all tables
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resetAll = searchParams.get("resetAll") === "true";
    const id = searchParams.get("id");

    const event = await getDefaultEvent();
    if (!event) {
      return NextResponse.json({ error: "Database is not available yet" }, { status: 503 });
    }

    if (resetAll) {
      await prisma.diningTable.deleteMany({
        where: { eventId: event.id },
      });
      return NextResponse.json({ success: true, message: "All tables cleared." });
    }

    if (id) {
      await prisma.diningTable.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Table deleted." });
    }

    return NextResponse.json({ error: "Missing id or resetAll parameter." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

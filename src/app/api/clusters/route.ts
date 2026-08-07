import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultEvent, formatGuest } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/clusters - Fetch all clusters with guest counts
export async function GET() {
  try {
    const event = await getDefaultEvent();
    if (!event) {
      return NextResponse.json({ clusters: [] });
    }

    // Check existing cluster names first to avoid multi-roundtrip findMany queries
    const existingClusters = await prisma.cluster.findMany({
      where: { eventId: event.id },
      select: { id: true, name: true },
    });

    const defaultClusters = [
      { name: "Family", description: "Family members and close relatives" },
      { name: "Diplomats", description: "Ambassadors, Envoys and Diplomatic Corps" },
      { name: "Government Officials", description: "Ministers, Cabinet Secretaries, Governors and State Officials" },
      { name: "Clergy", description: "Bishops, Pastors, Priests and Religious Leaders" },
      { name: "Chairceos", description: "Chairceos and chair leadership group" },
      { name: "Guests", description: "Honored Guests and General Attendees" },
    ];

    const existingNamesLower = new Set(existingClusters.map((c) => c.name.toLowerCase()));
    const missingDefaults = defaultClusters.filter((c) => !existingNamesLower.has(c.name.toLowerCase()));

    if (missingDefaults.length > 0) {
      await Promise.all(
        missingDefaults.map((c) =>
          prisma.cluster.upsert({
            where: { eventId_name: { eventId: event.id, name: c.name } },
            update: { description: c.description },
            create: { eventId: event.id, ...c },
          })
        )
      );
    }

    const clusters = await prisma.cluster.findMany({
      where: { eventId: event.id },
      include: {
        _count: {
          select: { guests: true },
        },
        guests: {
          include: {
            qrCode: true,
            checkIn: true,
            seatingAssignment: {
              include: {
                seat: {
                  include: {
                    diningTable: true,
                  },
                },
              },
            },
            guestRoles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: { fullName: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = clusters.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      guestCount: c._count.guests,
      guests: c.guests.map((g) => formatGuest({ ...g, cluster: c })),
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ clusters: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clusters - Create a new cluster
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Cluster name is required" }, { status: 400 });
    }

    const event = await getDefaultEvent();
    if (!event) {
      return NextResponse.json({ error: "Database is not available yet" }, { status: 503 });
    }

    const cluster = await prisma.cluster.create({
      data: {
        eventId: event.id,
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json(cluster, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A cluster with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clusters - Delete a cluster by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Cluster ID is required" }, { status: 400 });
    }

    await prisma.cluster.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Cluster deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

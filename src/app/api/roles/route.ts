import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        guestRoles: {
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissionCount: r.permissions.length,
        guestCount: r.guestRoles.length,
        permissions: r.permissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[ROLES API] Error fetching roles:", err);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    const role = await prisma.role.create({
      data: { name: name.trim().toUpperCase(), description: description?.trim() || null },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A role with that name already exists" }, { status: 409 });
    }
    console.error("[ROLES API] Error creating role:", err);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}

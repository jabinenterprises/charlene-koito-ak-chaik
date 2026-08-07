import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let permissions = await prisma.permission.findMany({
      include: {
        roles: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });

    if (permissions.length === 0) {
      const defaultPerms = [
        { name: "view_admin", description: "Access and view admin dashboard" },
        { name: "View guests", description: "View guest list and details" },
        { name: "Edit guests", description: "Edit guest details and info" },
        { name: "Check in", description: "Perform check-in for guests" },
        { name: "Assign tables", description: "Assign or move guests to seating tables" },
        { name: "Clear registry", description: "Clear or reset guest registry data" },
        { name: "Download PDF", description: "Download PDF badges and invitations" },
        { name: "Import Sheets", description: "Import delegates via Excel/CSV spreadsheets" },
        { name: "Export Sheets", description: "Export guest and RSVP data" },
        { name: "General delete", description: "Delete records and entities" },
        { name: "Access admin activities", description: "Access role and cluster permissions management" },
      ];
      await Promise.all(
        defaultPerms.map((p) =>
          prisma.permission.upsert({
            where: { name: p.name },
            update: { description: p.description },
            create: p,
          })
        )
      );
      permissions = await prisma.permission.findMany({
        include: {
          roles: {
            include: { role: { select: { id: true, name: true } } },
          },
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      permissions: permissions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        roleCount: p.roles.length,
        roles: p.roles.map((rp) => ({
          id: rp.role.id,
          name: rp.role.name,
        })),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[PERMISSIONS API] Error fetching permissions:", err);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Permission name is required" }, { status: 400 });
    }
    const permission = await prisma.permission.create({
      data: { name: name.trim(), description: description?.trim() || null },
    });
    return NextResponse.json({ permission }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A permission with that name already exists" }, { status: 409 });
    }
    console.error("[PERMISSIONS API] Error creating permission:", err);
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
}

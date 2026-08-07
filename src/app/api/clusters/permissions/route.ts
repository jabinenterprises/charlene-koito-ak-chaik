import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/clusters/permissions
// Returns all clusters with their assigned permissions, plus all available permissions.
export async function GET() {
  try {
    const [clusters, permissions, clusterPermissions] = await Promise.all([
      prisma.cluster.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" },
      }),
      prisma.permission.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, description: true },
      }),
      (prisma as any).clusterPermission.findMany({
        include: {
          permission: { select: { id: true, name: true, description: true } },
        },
      }),
    ]);

    const cpMap = new Map<string, Array<{ id: string; name: string; description?: string }>>();
    for (const cp of clusterPermissions) {
      const arr = cpMap.get(cp.clusterId) ?? [];
      arr.push(cp.permission);
      cpMap.set(cp.clusterId, arr);
    }

    return NextResponse.json({
      clusters: clusters.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        permissions: cpMap.get(c.id) ?? [],
      })),
      permissions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/clusters/permissions
// Body: { clusterId, permissionId } — assigns a permission to a cluster
export async function POST(req: Request) {
  try {
    const { clusterId, permissionId } = await req.json();
    if (!clusterId || !permissionId) {
      return NextResponse.json({ error: "clusterId and permissionId are required" }, { status: 400 });
    }
    await (prisma as any).clusterPermission.upsert({
      where: { clusterId_permissionId: { clusterId, permissionId } },
      update: {},
      create: { clusterId, permissionId },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/clusters/permissions?clusterId=X&permissionId=Y
// Removes a permission from a cluster
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clusterId = searchParams.get("clusterId");
    const permissionId = searchParams.get("permissionId");
    if (!clusterId || !permissionId) {
      return NextResponse.json({ error: "clusterId and permissionId are required" }, { status: 400 });
    }
    await (prisma as any).clusterPermission.delete({
      where: { clusterId_permissionId: { clusterId, permissionId } },
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2025") return NextResponse.json({ ok: true }); // idempotent
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

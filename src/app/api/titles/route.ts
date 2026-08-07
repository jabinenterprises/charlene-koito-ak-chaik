import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultEvent } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/titles - Retrieve list of honorific titles
export async function GET() {
  try {
    await getDefaultEvent(); // ensures auto-seeding of default titles if not present
    const titles = await prisma.title.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ titles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { updateGuest } from "@/services/guest.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id?: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const body = await request.json();
    const { name, title, cluster, clusterId, phone, country, pin, code } = body as any;

    const delegate = await updateGuest(id, {
      name,
      title,
      cluster,
      clusterId,
      phone,
      country,
      pin: pin || code,
    });
    if (!delegate) return NextResponse.json({ error: "Not found or no changes" }, { status: 404 });
    return NextResponse.json({ delegate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

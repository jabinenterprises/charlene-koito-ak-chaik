import { NextResponse } from "next/server";
import {
  getRsvpSummary,
  markCardSent,
  submitRsvp,
} from "@/services/rsvp.service";

export const dynamic = "force-dynamic";

// GET /api/rsvp - Fetch all RSVPs and summary stats
export async function GET() {
  try {
    const summary = await getRsvpSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/rsvp - Submit or update guest RSVP
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitRsvp(body);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "GUEST_NOT_FOUND") {
      return NextResponse.json(
        { error: "Guest not found for provided code or ID" },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const result = await markCardSent(body);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "GUEST_NOT_FOUND") {
      return NextResponse.json(
        { error: "Guest not found for provided code or ID" },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

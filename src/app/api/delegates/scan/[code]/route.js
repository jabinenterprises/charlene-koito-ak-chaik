import { prisma } from "@/lib/prisma";
import { formatGuest } from "@/lib/utils";

export const dynamic = "force-dynamic";

const includeRelations = {
  qrCode: true,
  checkIn: true,
  rsvp: true,
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
};

export async function GET(request, { params }) {
  try {
    const { code } = await params;

    if (!code) {
      return Response.json({ error: "Search query or code is required" }, { status: 400 });
    }

    const query = code.trim();
    const isNumeric = /^\d+$/.test(query);
    const isExactCodeCandidate = /^[A-Za-z0-9]{4}$/.test(query);

    const qrRecord = await prisma.qRCode.findFirst({
      where: {
        code: {
          equals: query,
          mode: "insensitive",
        },
      },
      include: { guest: { include: includeRelations } },
    });

    if (qrRecord && qrRecord.guest) {
      const formatted = formatGuest(qrRecord.guest);
      return Response.json({ delegate: formatted, matches: [formatted] });
    }

    const guestByPin = await prisma.guest.findFirst({
      where: {
        OR: [
          { pin: { equals: query, mode: "insensitive" } },
          { pinFingerprint: { equals: query, mode: "insensitive" } },
          { phone: { equals: query, mode: "insensitive" } },
        ],
      },
      include: includeRelations,
    });

    if (guestByPin) {
      const formatted = formatGuest(guestByPin);
      return Response.json({ delegate: formatted, matches: [formatted] });
    }

    if (isExactCodeCandidate) {
      return Response.json(
        {
          error: `No delegate found for guest code or pin "${query}".`,
        },
        { status: 404 },
      );
    }

    let OR = [];
    if (isNumeric) {
      if (query.length < 4) {
        return Response.json({ delegate: null, matches: [], message: "Type all 4 digits of the code." });
      }
      OR = [
        { pin: { equals: query } },
        { pinFingerprint: { equals: query } },
        { qrCode: { code: { equals: query } } },
      ];
    } else {
      OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ];
    }

    const rawMatches = await prisma.guest.findMany({
      where: { OR },
      include: includeRelations,
      take: 50,
    });

    if (!rawMatches || rawMatches.length === 0) {
      return Response.json({ error: `No delegate found starting with "${query}".` }, { status: 404 });
    }

    const matches = rawMatches.map(formatGuest);

    matches.sort((a, b) => {
      const codeA = (a.code || "").toLowerCase();
      const codeB = (b.code || "").toLowerCase();
      const target = query.toLowerCase();
      const exactA = codeA === target;
      const exactB = codeB === target;
      if (exactA && !exactB) return -1;
      if (!exactA && exactB) return 1;
      const startsA = codeA.startsWith(target);
      const startsB = codeB.startsWith(target);
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });

    if (matches.length === 1) {
      return Response.json({ delegate: matches[0], matches });
    }

    return Response.json({ delegate: null, matches, message: `Found ${matches.length} matching guests.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

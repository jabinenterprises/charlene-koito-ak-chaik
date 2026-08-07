import { prisma } from "./prisma";

// Normalize phone numbers by removing single quotes, apostrophes, spaces, dashes, parentheses
export function normalizePhone(
  phone: string | number | null | undefined,
): string | null {
  if (!phone) return null;
  const str = String(phone).replace(/[''""`’‘]/g, "").trim();
  const cleaned = str.replace(/[^\d]/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

export function getPhoneSuffix(phone: string, minLength = 7): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return "";
  if (normalized.length <= minLength) return normalized;
  return normalized.slice(-minLength);
}

const shouldSkipDbInitialization =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.SKIP_DB_INIT === "1" ||
  process.env.SKIP_DB_INIT === "true";

// Get or auto-create default Event with seeded Roles, Titles, and Admin A000
export async function getDefaultEvent() {
  if (shouldSkipDbInitialization) {
    return null;
  }

  let event = await prisma.event.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        id: "default-koito-event-2026",
        name: "Koito Annual Gala 2026",
        venue: "Grand Ballroom",
        description: "Official Koito Event & High-Level Gala Dinner",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000 * 365),
        status: "ACTIVE",
      },
    });

    // Auto-seed Roles
    const defaultRoles = [
      {
        name: "ADMIN",
        description: "Full system administration & desk management",
      },
      { name: "VIP", description: "Very Important Person / Dignitary" },
      { name: "Speaker", description: "Keynote & Panel Presenter" },
      { name: "Delegate", description: "General Confirmed Delegate" },
      { name: "Honored Guest", description: "Invited High-Level Guest" },
      { name: "Organizer", description: "Event Coordination Team" },
      { name: "Press", description: "Accredited Media & Press" },
    ];
    for (const r of defaultRoles) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: {},
        create: r,
      });
    }

    // Auto-seed Titles
    const defaultTitles = [
      "H.E.",
      "Hon.",
      "Dr.",
      "Prof.",
      "Ambassador",
      "Amb.",
      "Eng.",
      "Gen.",
      "Mr.",
      "Ms.",
      "Mrs.",
      "Miss",
      "Rev.",
      "Pastor",
      "Capt.",
      "Col.",
      "Chief",
      "Elder",
    ];
    for (const name of defaultTitles) {
      await prisma.title.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // Auto-seed Clusters
    const defaultClusters = [
      { name: "Executive Delegation" },
      { name: "Ministry & State" },
      { name: "Corporate Partners" },
      { name: "Keynote Speakers" },
      { name: "General Attendees" },
    ];
    for (const c of defaultClusters) {
      await prisma.cluster.upsert({
        where: { eventId_name: { eventId: event.id, name: c.name } },
        update: {},
        create: { eventId: event.id, ...c },
      });
    }

    // Auto-seed Admin Guest A000
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    const adminGuest = await prisma.guest.upsert({
      where: {
        eventId_pinFingerprint: { eventId: event.id, pinFingerprint: "A000" },
      },
      update: {},
      create: {
        eventId: event.id,
        fullName: "System Administrator",
        pin: "A000",
        pinHash: "A000",
        pinFingerprint: "A000",
        notes: "System Admin Account",
      },
    });

    await prisma.qRCode.upsert({
      where: { code: "A000" },
      update: {},
      create: { guestId: adminGuest.id, code: "A000" },
    });

    if (adminRole) {
      await prisma.guestRole.upsert({
        where: {
          guestId_roleId_eventId: {
            guestId: adminGuest.id,
            roleId: adminRole.id,
            eventId: event.id,
          },
        },
        update: {},
        create: {
          guestId: adminGuest.id,
          roleId: adminRole.id,
          eventId: event.id,
        },
      });
    }

    await prisma.checkIn.upsert({
      where: { guestId: adminGuest.id },
      update: {},
      create: { guestId: adminGuest.id, checkedInAt: new Date() },
    });
  }

  return event;
}

// Unambiguous alphanumeric charset — removes characters that look alike in different cases:
// Removed letters: B (like 8), I (like 1/l), L (like 1/I), O (like 0), S (like 5)
// Removed digits:  0 (like O), 1 (like I/l), 5 (like S)
const GUEST_CODE_CHARS = "ACDEFGHJKMNPQRTUVWXY2346789";

// Generate a unique 4-character unambiguous alphanumeric code for guests
export async function generateUnique4DigitCode() {
  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10000) {
    code = Array.from({ length: 4 }, () =>
      GUEST_CODE_CHARS[Math.floor(Math.random() * GUEST_CODE_CHARS.length)]
    ).join("");

    // Check if code already exists in PostgreSQL database
    const existing = await prisma.qRCode.findUnique({
      where: { code },
    });

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error(
      "Unable to generate a unique alphanumeric code. Please try again.",
    );
  }

  return code;
}

// Generate a unique alphanumeric admin code: A000–A999
// Admin codes are always 4 chars starting with "A" — visually distinct from guest codes.
export async function generateUniqueAdminCode() {
  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 1000) {
    const num = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    code = `A${num}`;

    // A000 is reserved as the default system admin — skip it during auto-generation
    if (code === "A000") {
      attempts++;
      continue;
    }

    const existing = await prisma.qRCode.findUnique({
      where: { code },
    });

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error(
      "Unable to generate a unique admin code. All A000–A999 codes are in use.",
    );
  }

  return code;
}

// Format Prisma Guest model into frontend-compatible Delegate shape
export function formatGuest(guest: any) {
  if (!guest) return null;
  const roleName =
    guest.guestRoles && guest.guestRoles.length > 0
      ? guest.guestRoles[0].role?.name
      : "Delegate";
  const clusterName = guest.cluster?.name || "General";
  const table = guest.seatingAssignment?.seat?.diningTable || null;
  const seatNumber = guest.seatingAssignment?.seat?.seatNumber || null;
  const code = guest.qrCode?.code || "";
  const checkedIn = Boolean(guest.checkIn);
  const rsvpStatus =
    guest.rsvp?.status || (checkedIn ? "ATTENDING" : "PENDING");

  return {
    id: guest.id,
    pin: guest.pin || code || "",
    code: code || guest.pin || "",
    name: guest.fullName,
    title: guest.title?.name || null,
    country: guest.country || null,
    phone: guest.phone || null,
    cluster: clusterName,
    clusterId: guest.clusterId || guest.cluster?.id || null,
    role: roleName || "Delegate",
    status: checkedIn ? "CHECKED_IN" : "INVITED",
    rsvpStatus,
    tableId: table?.id || null,
    seatNumber,
    table: table ? { id: table.id, name: table.name } : null,
    notes: guest.notes || null,
    checkedInAt: guest.checkIn?.checkedInAt || null,
    dietary: guest.dietaryRequirements || guest.rsvp?.guestNotes || null,
    createdAt: guest.createdAt,
    updatedAt: guest.updatedAt,
  };
}

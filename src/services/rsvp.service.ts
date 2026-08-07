import { prisma } from "@/lib/prisma";
import { createAuditLog } from "./audit.service";
import { formatGuest, getDefaultEvent, normalizePhone, getPhoneSuffix } from "@/lib/utils";
import type { RSVPStatus } from "@prisma/client";

export interface SubmitRsvpInput {
  code?: string;
  pin?: string;
  guestId?: string;
  attending: string;
  dietary?: string;
  message?: string;
  notes?: string;
}

export interface MarkCardSentInput {
  guestId?: string;
  code?: string;
  pin?: string;
  guestName?: string;
  sentBy?: string;
}

/**
 * Service function to retrieve all RSVPs with summary statistics.
 */
export async function getRsvpSummary() {
  const rsvps = await prisma.rSVP.findMany({
    include: {
      guest: {
        include: {
          qrCode: true,
          checkIn: true,
          invitationDispatch: true,
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
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedRsvps = rsvps.map((r) => ({
    id: r.id,
    guestId: r.guestId,
    name: r.guest.fullName,
    pin: r.guest.pin || r.guest.qrCode?.code || "",
    attending:
      r.status === "ATTENDING"
        ? "yes"
        : r.status === "NOT_ATTENDING"
          ? "no"
          : "pending",
    status: r.status,
    guestName: r.guest.fullName,
    dietary: r.guestNotes || r.guest.dietaryRequirements || "",
    message: r.guestNotes || "",
    respondedAt: r.respondedAt || r.updatedAt,
    timestamp: (r.respondedAt || r.updatedAt).toISOString(),
    cardSent: Boolean(r.cardSentAt || r.guest.invitationDispatch),
    cardSentAt: (r.cardSentAt || r.guest.invitationDispatch?.sentAt)?.toISOString() || null,
    sentBy: r.guest.invitationDispatch?.sentBy || null,
  }));

  return {
    rsvps: formattedRsvps,
    total: formattedRsvps.length,
    attendingCount: formattedRsvps.filter((r) => r.attending === "yes").length,
    declinedCount: formattedRsvps.filter((r) => r.attending === "no").length,
    cardSentCount: formattedRsvps.filter((r) => r.cardSent).length,
  };
}


export async function markCardSent(input: MarkCardSentInput) {
  const { guestId, code, pin, guestName, sentBy } = input;
  const queryCode = (code || pin || "").trim();

  let guest: any = null;

  if (guestId) {
    guest = await prisma.guest.findUnique({
      where: { id: String(guestId) },
      include: { rsvp: true },
    });
  }

  if (!guest && queryCode) {
    guest = await prisma.guest.findFirst({
      where: {
        OR: [
          { pin: queryCode },
          { qrCode: { code: queryCode } },
          { pinFingerprint: queryCode },
          { fullName: { equals: queryCode, mode: "insensitive" } },
        ],
      },
      include: { rsvp: true },
    });
  }

  if (!guest && guestName) {
    guest = await prisma.guest.findFirst({
      where: { fullName: { equals: guestName, mode: "insensitive" } },
      include: { rsvp: true },
    });
  }

  if (!guest) {
    throw new Error("GUEST_NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    const existingRsvp = await tx.rSVP.findUnique({
      where: { guestId: guest.id },
    });

    const cardSentAt = new Date();
    const senderName = sentBy?.trim() || "admin-dashboard";

    const rsvpRecord = existingRsvp
      ? await tx.rSVP.update({
          where: { id: existingRsvp.id },
          data: { cardSentAt },
        })
      : await tx.rSVP.create({
          data: {
            guestId: guest.id,
            status: "PENDING",
            cardSentAt,
          },
        });

    await tx.invitationDispatch.upsert({
      where: { guestId: guest.id },
      update: {
        sentAt: cardSentAt,
        sentBy: senderName,
        method: "card",
        notes: "Marked as card sent from the admin RSVP dashboard",
      },
      create: {
        guestId: guest.id,
        sentAt: cardSentAt,
        sentBy: senderName,
        method: "card",
        notes: "Marked as card sent from the admin RSVP dashboard",
      },
    });

    await createAuditLog(
      {
        actorType: "ADMIN",
        actorId: guest.id,
        action: "RSVP_SUBMIT",
        entityType: "RSVP",
        entityId: rsvpRecord.id,
        metadata: {
          guestName: guest.fullName,
          cardSentAt: cardSentAt.toISOString(),
        },
      },
      tx,
    );

    return {
      message: "Card sent status updated",
      rsvp: {
        id: rsvpRecord.id,
        status: rsvpRecord.status,
        attending:
          rsvpRecord.status === "ATTENDING"
            ? "yes"
            : rsvpRecord.status === "NOT_ATTENDING"
              ? "no"
              : "pending",
        cardSent: Boolean(rsvpRecord.cardSentAt),
        cardSentAt: rsvpRecord.cardSentAt?.toISOString() || null,
      },
    };
  });
}

export async function reconcilePendingRsvpFromPhones(phoneNumbers: string[]) {
  const uniquePhones = Array.from(
    new Set(
      phoneNumbers
        .map((value) => normalizePhone(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const event = await getDefaultEvent();
  if (!event) {
    return {
      processed: 0,
      updated: 0,
      skippedAlreadyAttending: 0,
      notFound: 0,
    };
  }

  let processed = 0;
  let updated = 0;
  let skippedAlreadyAttending = 0;
  let notFound = 0;

  for (const rawPhone of uniquePhones) {
    processed += 1;
    const cleanPhone = normalizePhone(rawPhone) || rawPhone.replace(/[^\d]/g, "");
    const suffix = getPhoneSuffix(cleanPhone, 7);

    let guest = await prisma.guest.findFirst({
      where: {
        eventId: event.id,
        OR: [
          { phone: cleanPhone },
          { phone: rawPhone },
          { phone: { endsWith: suffix } },
          { phone: { contains: suffix } },
        ],
      },
      include: {
        rsvp: true,
      },
    });

    if (!guest) {
      // Fallback check against all guests in event to handle phone numbers stored with leading quotes, spaces, or formatting in DB
      const allGuests = await prisma.guest.findMany({
        where: { eventId: event.id, phone: { not: null } },
        include: { rsvp: true },
      });
      guest =
        allGuests.find((g) => {
          if (!g.phone) return false;
          const gNorm = normalizePhone(g.phone);
          if (!gNorm) return false;
          if (gNorm === cleanPhone) return true;
          const gSuffix = getPhoneSuffix(gNorm, 7);
          return Boolean(gSuffix && suffix && gSuffix === suffix);
        }) || null;
    }

    if (!guest) {
      notFound += 1;
      continue;
    }

    if (guest.rsvp) {
      if (guest.rsvp.status === "ATTENDING") {
        skippedAlreadyAttending += 1;
        continue;
      }

      await prisma.rSVP.update({
        where: { id: guest.rsvp.id },
        data: {
          status: "ATTENDING",
          respondedAt: new Date(),
        },
      });
      updated += 1;
      continue;
    }

    await prisma.rSVP.create({
      data: {
        guestId: guest.id,
        status: "ATTENDING",
        respondedAt: new Date(),
      },
    });

    updated += 1;
  }

  return {
    processed,
    updated,
    skippedAlreadyAttending,
    notFound,
  };
}

export async function submitRsvp(input: SubmitRsvpInput) {
  const { code, pin, guestId, attending, dietary, message, notes } = input;
  const queryCode = (code || pin || "").trim();

  let guest: any = null;

  if (guestId) {
    guest = await prisma.guest.findUnique({
      where: { id: String(guestId) },
      include: {
        qrCode: true,
        checkIn: true,
        rsvp: true,
        guestRoles: { include: { role: true } },
      },
    });
  }

  if (!guest && queryCode) {
    guest = await prisma.guest.findFirst({
      where: {
        OR: [
          { pin: queryCode },
          { qrCode: { code: queryCode } },
          { pinFingerprint: queryCode },
          { fullName: { equals: queryCode, mode: "insensitive" } },
        ],
      },
      include: {
        qrCode: true,
        checkIn: true,
        rsvp: true,
        guestRoles: { include: { role: true } },
      },
    });
  }

  // If guest still doesn't exist in DB, auto-create Guest so RSVP is permanently stored in PostgreSQL
  if (!guest && queryCode) {
    const event = await getDefaultEvent();
    if (!event) {
      throw new Error("DB_UNAVAILABLE");
    }

    const defaultGuestRole = await prisma.role.upsert({
      where: { name: "GUEST" },
      update: { description: "Default Guest Role" },
      create: { name: "GUEST", description: "Default Guest Role" },
    });

    guest = await prisma.guest.create({
      data: {
        eventId: event.id,
        fullName: queryCode,
        pin: queryCode,
        pinHash: queryCode,
        pinFingerprint: queryCode,
        qrCode: {
          create: { code: queryCode },
        },
        guestRoles: {
          create: {
            roleId: defaultGuestRole.id,
            eventId: event.id,
          },
        },
      },
      include: {
        qrCode: true,
        checkIn: true,
        rsvp: true,
        guestRoles: { include: { role: true } },
      },
    });
  }

  if (!guest) {
    throw new Error("GUEST_NOT_FOUND");
  }

  const rsvpStatus: RSVPStatus =
    attending === "yes" || attending === "ATTENDING"
      ? "ATTENDING"
      : "NOT_ATTENDING";
  const guestNotesText =
    [dietary, message, notes].filter(Boolean).join(" | ") || null;

  return await prisma.$transaction(async (tx) => {
    // 1. Upsert RSVP record in PostgreSQL
    const rsvpRecord = await tx.rSVP.upsert({
      where: { guestId: guest.id },
      update: {
        status: rsvpStatus,
        respondedAt: new Date(),
        guestNotes: guestNotesText,
      },
      create: {
        guestId: guest.id,
        status: rsvpStatus,
        respondedAt: new Date(),
        guestNotes: guestNotesText,
      },
    });

    // 2. Optionally update guest dietary requirements / notes
    if (dietary || notes) {
      await tx.guest.update({
        where: { id: guest.id },
        data: {
          dietaryRequirements: dietary || undefined,
          notes: notes || undefined,
        },
      });
    }

    // 3. Log Audit inside transaction
    await createAuditLog(
      {
        actorType: "GUEST",
        actorId: guest.id,
        action: "RSVP_SUBMIT",
        entityType: "RSVP",
        entityId: rsvpRecord.id,
        metadata: { guestName: guest.fullName, status: rsvpStatus, dietary },
      },
      tx,
    );

    // 4. Fetch updated guest state
    const updatedGuest = await tx.guest.findUnique({
      where: { id: guest.id },
      include: {
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
      },
    });

    return {
      message: "RSVP saved successfully to database",
      rsvp: {
        id: rsvpRecord.id,
        status: rsvpRecord.status,
        attending: rsvpRecord.status === "ATTENDING" ? "yes" : "no",
        respondedAt: rsvpRecord.respondedAt,
      },
      delegate: formatGuest(updatedGuest),
    };
  });
}

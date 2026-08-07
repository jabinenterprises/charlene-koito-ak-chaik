import { prisma } from "@/lib/prisma";
import { generateUnique4DigitCode, normalizePhone, getDefaultEvent, formatGuest } from "@/lib/utils";
import { createAuditLog } from "./audit.service";
import type { Prisma } from "@prisma/client";

export interface GetDelegatesParams {
  search?: string;
  status?: string;
  cluster?: string;
  pageParam?: string;
  limitParam?: string;
}

export interface CreateGuestParams {
  name: string;
  phone?: string | null;
  role?: string;
  cluster?: string;
  clusterId?: string;
  title?: string | null;
  titleId?: string | null;
  tableId?: string;
  notes?: string;
  code?: string;
}

const includeRelations = {
  qrCode: true,
  checkIn: true,
  rsvp: true,
  cluster: true,
  title: true,
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

/**
 * Service function to retrieve formatted delegate lists and pagination stats.
 */
export async function getDelegates(params: GetDelegatesParams) {
  const { search = "", status = "", cluster = "ALL", pageParam = "1", limitParam = "10" } = params;

  const where: any = {};
  const trimmedSearch = search.trim();
  const isNumeric = /^\d+$/.test(trimmedSearch);
  const filters: any[] = [];

  if (trimmedSearch) {
    if (isNumeric) {
      filters.push({
        OR: [
          { pin: { startsWith: trimmedSearch, mode: "insensitive" } },
          { pinFingerprint: { startsWith: trimmedSearch, mode: "insensitive" } },
          { qrCode: { code: { startsWith: trimmedSearch, mode: "insensitive" } } },
          { phone: { startsWith: trimmedSearch } },
          { fullName: { startsWith: trimmedSearch, mode: "insensitive" } },
        ],
      });
    } else {
      filters.push({
        OR: [
          { fullName: { contains: trimmedSearch, mode: "insensitive" } },
          { pin: { startsWith: trimmedSearch, mode: "insensitive" } },
          { pinFingerprint: { startsWith: trimmedSearch, mode: "insensitive" } },
          { qrCode: { code: { startsWith: trimmedSearch, mode: "insensitive" } } },
          { phone: { startsWith: trimmedSearch } },
          { organization: { contains: trimmedSearch, mode: "insensitive" } },
        ],
      });
    }
  }

  if (status && status !== "ALL") {
    if (status === "CHECKED_IN") {
      filters.push({ checkIn: { isNot: null } });
    } else if (status === "INVITED") {
      filters.push({ checkIn: null });
    }
  }

  const clusterFilterValue = cluster?.trim();
  if (clusterFilterValue && clusterFilterValue.toUpperCase() !== "ALL") {
    filters.push({
      OR: [
        { clusterId: clusterFilterValue },
        { cluster: { name: { equals: clusterFilterValue, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.length > 0) {
    where.AND = filters;
  }

  const isAll = limitParam.toUpperCase() === "ALL";
  const page = Math.max(1, parseInt(pageParam) || 1);
  const limit = isAll ? 0 : Math.max(1, parseInt(limitParam) || 10);

  const hasFilter = Object.keys(where).length > 0;

  const [
    total,
    guests,
    totalGlobal,
    checkedInGlobal,
    assignedSeatsGlobal,
    rsvpsGlobal,
    attendingRsvpsGlobal,
  ] = await Promise.all([
    hasFilter ? prisma.guest.count({ where }) : Promise.resolve(0),
    prisma.guest.findMany({
      where,
      include: includeRelations,
      orderBy: { createdAt: "desc" },
      ...(isAll ? {} : { skip: (page - 1) * limit, take: limit }),
    }),
    prisma.guest.count(),
    prisma.guest.count({ where: { checkIn: { isNot: null } } }),
    prisma.guest.count({ where: { seatingAssignment: { isNot: null } } }),
    prisma.rSVP.count(),
    prisma.rSVP.count({ where: { status: "ATTENDING" } }),
  ]);

  const effectiveTotal = hasFilter ? total : totalGlobal;
  const invitedGlobal = Math.max(0, totalGlobal - checkedInGlobal);

  const formattedDelegates = guests.map(formatGuest);

  if (trimmedSearch) {
    formattedDelegates.sort((a: any, b: any) => {
      const codeA = (a.code || "").toLowerCase();
      const codeB = (b.code || "").toLowerCase();
      const startsA = codeA.startsWith(trimmedSearch.toLowerCase());
      const startsB = codeB.startsWith(trimmedSearch.toLowerCase());
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });
  }

  const totalPages = isAll ? 1 : Math.ceil(effectiveTotal / (limit || 1));

  return {
    delegates: formattedDelegates,
    total: effectiveTotal,
    page,
    pageSize: isAll ? effectiveTotal : limit,
    totalPages,
    stats: {
      total: totalGlobal,
      checkedIn: checkedInGlobal,
      invited: invitedGlobal,
      cancelled: 0,
      assignedSeats: assignedSeatsGlobal,
      rsvps: rsvpsGlobal,
      attendingRsvps: attendingRsvpsGlobal,
    },
  };
}

/**
 * Service function to create a Guest with PIN, QRCode, Seating, GuestRole, and AuditLog.
 */
export async function createGuest(params: CreateGuestParams) {
  const { name, phone: rawPhone, role, cluster, clusterId, title, titleId, tableId, notes, code: inputCode } = params;

  if (!name) {
    throw new Error("NAME_REQUIRED");
  }

  const event = await getDefaultEvent();
  if (!event) {
    throw new Error("DB_UNAVAILABLE");
  }

  const phone = normalizePhone(rawPhone);

  if (phone) {
    const existing = await prisma.guest.findFirst({
      where: { phone, eventId: event.id },
      include: { qrCode: true },
    });
    if (existing) {
      throw new Error(`DUPLICATE_PHONE:${phone}:${existing.fullName}:${existing.qrCode?.code || "N/A"}`);
    }
  }

  let targetTitleId: string | null = titleId || null;
  if (!targetTitleId && title) {
    const rawTitle = title.trim();
    if (rawTitle) {
      const matchedTitle = await prisma.title.findFirst({
        where: { name: { equals: rawTitle, mode: "insensitive" } },
      });
      if (matchedTitle) {
        targetTitleId = matchedTitle.id;
      }
    }
  }

  let targetClusterId: string | null = clusterId || null;
  if (!targetClusterId && cluster) {
    const matched = await prisma.cluster.findFirst({
      where: {
        eventId: event.id,
        name: { equals: cluster.trim(), mode: "insensitive" },
      },
    });
    if (matched) {
      targetClusterId = matched.id;
    }
  }
  if (!targetClusterId) {
    const defaultCls = await prisma.cluster.findFirst({
      where: { eventId: event.id, name: { equals: "Guests", mode: "insensitive" } },
    }) || await prisma.cluster.findFirst({ where: { eventId: event.id } });
    if (defaultCls) targetClusterId = defaultCls.id;
  }

  let targetSeatId: string | null = null;

  if (tableId === "auto") {
    const allTables = await prisma.diningTable.findMany({
      where: { eventId: event.id },
      include: { seats: { include: { seatingAssignment: true } } },
      orderBy: { name: "asc" },
    });

    for (const t of allTables) {
      const openSeat = t.seats.find((s: any) => !s.seatingAssignment);
      if (openSeat) {
        targetSeatId = openSeat.id;
        break;
      }
    }
  } else if (tableId && tableId !== "none" && tableId !== "unassigned" && tableId !== "") {
    let targetTable = await prisma.diningTable.findUnique({
      where: { id: String(tableId) },
      include: { seats: { include: { seatingAssignment: true } } },
    });

    if (!targetTable) {
      targetTable = await prisma.diningTable.findFirst({
        where: {
          eventId: event.id,
          name: { equals: String(tableId).trim(), mode: "insensitive" },
        },
        include: { seats: { include: { seatingAssignment: true } } },
      });
    }

    if (targetTable) {
      const openSeat = targetTable.seats.find((s: any) => !s.seatingAssignment);
      if (openSeat) {
        targetSeatId = openSeat.id;
      }
    }
  }

  const code = inputCode ? String(inputCode).trim() : await generateUnique4DigitCode();

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const guest = await tx.guest.create({
      data: {
        eventId: event.id,
        fullName: name,
        phone,
        clusterId: targetClusterId,
        titleId: targetTitleId,
        notes: notes || null,
        pin: code,
        pinHash: code,
        pinFingerprint: code,
        qrCode: {
          create: { code },
        },
      },
    });

    if (targetSeatId) {
      const isTaken = await tx.seatingAssignment.findUnique({
        where: { seatId: targetSeatId },
      });
      if (!isTaken) {
        await tx.seatingAssignment.create({
          data: {
            guestId: guest.id,
            seatId: targetSeatId,
          },
        }).catch(() => {});
      }
    }

    // Default role must ALWAYS be "GUEST" from the roles table
    const defaultGuestRole = await tx.role.upsert({
      where: { name: "GUEST" },
      update: { description: "Default Guest Role" },
      create: { name: "GUEST", description: "Default Guest Role" },
    });

    await tx.guestRole.create({
      data: {
        guestId: guest.id,
        roleId: defaultGuestRole.id,
        eventId: event.id,
      },
    });

    // If an additional specific role was provided (and it's not GUEST), assign that too
    if (role && role.toUpperCase().trim() !== "GUEST") {
      const extraRoleName = role.toUpperCase().trim();
      const extraRoleRecord = await tx.role.upsert({
        where: { name: extraRoleName },
        update: {},
        create: { name: extraRoleName, description: `${extraRoleName} Role` },
      });
      await tx.guestRole.create({
        data: {
          guestId: guest.id,
          roleId: extraRoleRecord.id,
          eventId: event.id,
        },
      }).catch(() => {});
    }

    const createdGuest = await tx.guest.findUnique({
      where: { id: guest.id },
      include: includeRelations,
    });

    await createAuditLog(
      {
        actorType: "ADMIN",
        actorId: "admin",
        action: "CREATE",
        entityType: "GUEST",
        entityId: createdGuest?.id || "unknown",
        metadata: { name: createdGuest?.fullName, code: createdGuest?.pin, role },
      },
      tx
    );

    return formatGuest(createdGuest);
  });
}

export interface UpdateGuestParams {
  name?: string | null;
  title?: string | null;
  cluster?: string | null;
  clusterId?: string | null;
  phone?: string | null;
  country?: string | null;
  pin?: string | null;
}

export async function updateGuest(id: string, updates: UpdateGuestParams) {
  const event = await getDefaultEvent();
  if (!event) {
    throw new Error("DB_UNAVAILABLE");
  }

  const dataToUpdate: any = {};
  if (updates.name !== undefined) dataToUpdate.fullName = updates.name;
  if (updates.phone !== undefined) dataToUpdate.phone = updates.phone ? normalizePhone(updates.phone) : null;
  if (updates.country !== undefined) dataToUpdate.country = updates.country ? updates.country.trim() : null;

  if (updates.pin !== undefined) {
    const cleanPin = updates.pin ? String(updates.pin).trim() : null;
    if (cleanPin) {
      dataToUpdate.pin = cleanPin;
      dataToUpdate.pinHash = cleanPin;
      dataToUpdate.pinFingerprint = cleanPin;
      await prisma.qRCode
        .upsert({
          where: { guestId: id },
          update: { code: cleanPin },
          create: { guestId: id, code: cleanPin },
        })
        .catch(() => {});
    }
  }

  if (updates.title !== undefined) {
    const rawTitle = updates.title?.trim();
    if (rawTitle) {
      const matchedTitle = await prisma.title.findFirst({
        where: {
          name: { equals: rawTitle, mode: "insensitive" },
        },
      });
      if (matchedTitle) {
        dataToUpdate.titleId = matchedTitle.id;
      }
    } else {
      dataToUpdate.titleId = null;
    }
  }

  // Prefer explicit clusterId if provided, otherwise try to resolve cluster name
  if (updates.clusterId !== undefined) {
    dataToUpdate.clusterId = updates.clusterId;
  } else if (updates.cluster !== undefined) {
    const rawCluster = updates.cluster?.trim();
    if (rawCluster) {
      const matched = await prisma.cluster.findFirst({
        where: {
          eventId: event.id,
          name: { equals: rawCluster, mode: "insensitive" },
        },
      });
      if (matched) {
        dataToUpdate.clusterId = matched.id;
      }
    } else {
      dataToUpdate.clusterId = null;
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    const existing = await prisma.guest.findUnique({ where: { id }, include: includeRelations });
    return existing ? formatGuest(existing) : null;
  }

  const updated = await prisma.guest.update({
    where: { id },
    data: dataToUpdate,
    include: includeRelations,
  });

  return formatGuest(updated);
}

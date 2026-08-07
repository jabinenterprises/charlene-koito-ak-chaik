import { prisma } from "@/lib/prisma";
import { getDefaultEvent, formatGuest } from "@/lib/utils";
import { createAuditLog } from "./audit.service";

export interface CreateTableInput {
  name: string;
  capacity: number;
  zone?: string | null;
  description?: string | null;
}

/**
 * Service function to retrieve all dining tables and assigned guests.
 */
export async function getTablesWithSeating() {
  const event = await getDefaultEvent();
  if (!event) {
    return [];
  }

  const diningTables = await prisma.diningTable.findMany({
    where: { eventId: event.id },
    include: {
      seats: {
        orderBy: { seatNumber: "asc" },
        include: {
          seatingAssignment: {
            include: {
              guest: {
                include: {
                  qrCode: true,
                  checkIn: true,
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
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return diningTables.map((t: any) => {
    const assignedGuests = t.seats
      .filter((s: any) => s.seatingAssignment?.guest)
      .map((s: any) => formatGuest(s.seatingAssignment!.guest));

    return {
      id: t.id,
      name: t.name,
      zone: t.zone || null,
      capacity: t.seats.length,
      description: t.description || null,
      delegates: assignedGuests,
    };
  });
}

export interface AssignGuestInput {
  guestId: string;
  tableId: string | null;
  seatNumber?: number | null;
}

/**
 * Assign a guest to a table (first available seat, or specific seat number).
 * Pass tableId=null to unassign.
 */
export async function assignGuestToTable(input: AssignGuestInput) {
  const { guestId, tableId, seatNumber } = input;

  const event = await getDefaultEvent();
  if (!event) {
    throw new Error("DB_UNAVAILABLE");
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: {
      seatingAssignment: true,
    },
  });

  if (!guest) {
    throw new Error("GUEST_NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Remove current seating assignment if any
    if (guest.seatingAssignment) {
      await tx.seatingAssignment.delete({
        where: { id: guest.seatingAssignment.id },
      });
    }

    // Unassign request
    if (!tableId || tableId === "none" || tableId === "unassigned" || tableId === "") {
      await createAuditLog(
        {
          actorType: "ADMIN",
          actorId: "admin",
          action: "REMOVE",
          entityType: "SEATING_ASSIGNMENT",
          entityId: guest.id,
          metadata: {
            guestName: guest.fullName,
            action: "UNASSIGNED_FROM_TABLE",
          },
        },
        tx,
      );
      return { guestId: guest.id, tableId: null, tableName: "Unassigned" };
    }

    // 2. Find target table by UUID ID or Name
    let targetTable = await tx.diningTable.findUnique({
      where: { id: String(tableId) },
      include: { seats: { include: { seatingAssignment: true } } },
    });

    if (!targetTable) {
      targetTable = await tx.diningTable.findFirst({
        where: {
          eventId: event.id,
          name: { equals: String(tableId).trim(), mode: "insensitive" },
        },
        include: { seats: { include: { seatingAssignment: true } } },
      });
    }

    if (!targetTable) {
      throw new Error("TABLE_NOT_FOUND");
    }

    // 3. Find available seat
    let availableSeat = null;
    if (seatNumber) {
      availableSeat = targetTable.seats.find(
        (s) => s.seatNumber === parseInt(String(seatNumber)),
      );
      if (availableSeat?.seatingAssignment) {
        throw new Error(`TABLE_FULL:${targetTable.name}:${targetTable.seats.length}`);
      }
    }

    if (!availableSeat) {
      availableSeat = targetTable.seats.find((s) => !s.seatingAssignment);
    }

    if (!availableSeat) {
      throw new Error(`TABLE_FULL:${targetTable.name}:${targetTable.seats.length}`);
    }

    // 5. Create Seating Assignment in PostgreSQL
    await tx.seatingAssignment.create({
      data: {
        guestId: guest.id,
        seatId: availableSeat.id,
      },
    });

    // 6. Record Audit Log in PostgreSQL
    await createAuditLog(
      {
        actorType: "ADMIN",
        actorId: "admin",
        action: "ASSIGN",
        entityType: "SEATING_ASSIGNMENT",
        entityId: guest.id,
        metadata: {
          guestName: guest.fullName,
          tableId: targetTable.id,
          tableName: targetTable.name,
          seatNumber: availableSeat.seatNumber,
        },
      },
      tx,
    );

    return {
      guestId: guest.id,
      tableId: targetTable.id,
      tableName: targetTable.name,
      seatNumber: availableSeat.seatNumber,
    };
  });
}

/**
 * Bulk-assign multiple guests to tables in one request.
 */
export async function assignGuestsToTables(assignments: AssignGuestInput[]) {
  const results = [];
  for (const assignment of assignments) {
    results.push(await assignGuestToTable(assignment));
  }
  return results;
}

/**
 * Service function to atomically create a Dining Table and its Seats in a single transaction.
 */
export async function createTableWithSeats(input: CreateTableInput) {
  const { name, capacity, zone, description } = input;
  const event = await getDefaultEvent();
  if (!event) {
    throw new Error("DB_UNAVAILABLE");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create DiningTable
    const createdTable = await tx.diningTable.create({
      data: {
        eventId: event.id,
        name,
        zone: zone || null,
        description: description || null,
      },
    });

    // 2. Generate seat records
    const seatData = Array.from({ length: capacity }, (_, i) => ({
      diningTableId: createdTable.id,
      seatNumber: i + 1,
    }));

    await tx.seat.createMany({
      data: seatData,
    });

    // 3. Log Audit
    await createAuditLog(
      {
        actorType: "ADMIN",
        actorId: "system",
        action: "CREATE",
        entityType: "DINING_TABLE",
        entityId: createdTable.id,
        metadata: { tableName: name, capacity },
      },
      tx
    );

    // 4. Return created table structure
    const fullTable = await tx.diningTable.findUnique({
      where: { id: createdTable.id },
      include: { seats: true },
    });

    return {
      id: fullTable?.id,
      name: fullTable?.name,
      capacity: fullTable?.seats.length || capacity,
      delegates: [],
    };
  });
}

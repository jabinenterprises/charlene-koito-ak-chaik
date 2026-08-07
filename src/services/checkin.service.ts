import { prisma } from "@/lib/prisma";
import { getDefaultEvent, formatGuest } from "@/lib/utils";
import { createAuditLog } from "./audit.service";
import type { CheckInScanResult } from "@prisma/client";

export interface VerifyCodeResult {
  id: string;
  name: string;
  title?: string;
  code: string;
  role: string;
  table: string;
  status: "CHECKED_IN" | "INVITED";
  checkedIn: boolean;
  isAdmin: boolean;
  clusterPermissions: string[];
}

const includeGuestDetails = {
  qrCode: true,
  checkIn: true,
  cluster: {
    include: {
      clusterPermissions: {
        include: {
          permission: { select: { id: true, name: true } },
        },
      },
    },
  },
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
 * Service function to verify a guest code or PIN.
 */
export async function verifyGuestCode(code: string): Promise<VerifyCodeResult> {
  const queryCode = code.trim();
  await getDefaultEvent();

  const isSuperAdminPin = queryCode === (process.env.ADMIN_PIN || "A000");

  if (isSuperAdminPin) {
    // Get the default event (already fetched above)
    const event = await getDefaultEvent();
    if (event) {
      // Ensure Super Admin cluster exists
      let superAdminCluster = await prisma.cluster.findFirst({
        where: { name: "Super Admin" },
      });
      if (!superAdminCluster) {
        superAdminCluster = await prisma.cluster.create({
          data: {
            eventId: event.id,
            name: "Super Admin",
            description: "Full system access",
          },
        });
      }

      // Ensure default permissions exist
      let allPerms = await prisma.permission.findMany();
      if (allPerms.length === 0) {
        const defaultPerms = [
          {
            name: "view_admin",
            description: "Access and view admin dashboard",
          },
          { name: "View guests", description: "View guest list and details" },
          { name: "Edit guests", description: "Edit guest details and info" },
          { name: "Check in", description: "Perform check-in for guests" },
          {
            name: "Assign tables",
            description: "Assign or move guests to seating tables",
          },
          {
            name: "Clear registry",
            description: "Clear or reset guest registry data",
          },
          {
            name: "Download PDF",
            description: "Download PDF badges and invitations",
          },
          {
            name: "Import Sheets",
            description: "Import delegates via Excel/CSV spreadsheets",
          },
          { name: "Export Sheets", description: "Export guest and RSVP data" },
          {
            name: "General delete",
            description: "Delete records and entities",
          },
          {
            name: "Access admin activities",
            description: "Access role and cluster permissions management",
          },
        ];
        for (const p of defaultPerms) {
          await prisma.permission.upsert({
            where: { name: p.name },
            update: { description: p.description },
            create: p,
          });
        }
        allPerms = await prisma.permission.findMany();
      }

      // Ensure all permissions are assigned to Super Admin cluster
      for (const p of allPerms) {
        await (prisma as any).clusterPermission.upsert({
          where: {
            clusterId_permissionId: {
              clusterId: superAdminCluster.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            clusterId: superAdminCluster.id,
            permissionId: p.id,
          },
        });
      }

      // Ensure guest with this PIN exists and belongs to Super Admin cluster
      const adminGuest = await prisma.guest.findFirst({
        where: { pin: queryCode },
      });
      if (!adminGuest) {
        const adminPin = queryCode;
        await prisma.guest.create({
          data: {
            eventId: event.id,
            pin: adminPin,
            pinHash: adminPin,
            pinFingerprint: adminPin,
            fullName: "System Admin",
            clusterId: superAdminCluster.id,
          },
        });
      } else if (adminGuest.clusterId !== superAdminCluster.id) {
        await prisma.guest.update({
          where: { id: adminGuest.id },
          data: { clusterId: superAdminCluster.id },
        });
      }
    }
  }

  const guest = await prisma.guest.findFirst({
    where: {
      OR: [
        { pin: queryCode },
        { qrCode: { code: queryCode } },
        { pinFingerprint: queryCode },
      ],
    },
    include: includeGuestDetails as any,
  });

  if (!guest) {
    await createAuditLog({
      actorType: "SYSTEM",
      actorId: "anonymous",
      action: "VERIFY_FAILED",
      entityType: "AUTH",
      entityId: queryCode,
      metadata: { code: queryCode, reason: "Guest or code not found" },
    });
    throw new Error("INVALID_CODE");
  }

  const roleName = (guest as any).guestRoles?.[0]?.role?.name || "Delegate";

  // Collect cluster-level permissions
  let clusterPermissionNames: string[] = (
    (guest as any).cluster?.clusterPermissions || []
  ).map((cp: any) => cp.permission.name as string);

  // Super Admin always gets all permissions
  if (isSuperAdminPin || (guest as any).cluster?.name === "Super Admin") {
    const allSystemPerms = await prisma.permission.findMany();
    clusterPermissionNames = allSystemPerms.map((p) => p.name);
  }

  const clusterName = (guest as any).cluster?.name?.toLowerCase() || "";
  const hasAssistanceRoleOrCluster =
    clusterName.includes("assist") ||
    clusterName.includes("assit") ||
    (guest as any).guestRoles.some((gr: any) => {
      const roleName = gr.role?.name?.toLowerCase() || "";
      return roleName.includes("assist") || roleName.includes("assit");
    });

  // Mark assistance users with a special permission name so the client
  // can easily detect the verify-only UI flow for this cluster.
  if (hasAssistanceRoleOrCluster) {
    if (!clusterPermissionNames.includes("assistance")) {
      clusterPermissionNames.push("assistance");
    }
    // Assistance should be able to perform check-ins at the verification desk.
    if (!clusterPermissionNames.includes("check_in")) {
      clusterPermissionNames.push("check_in");
    }
  }

  // A guest is an admin if they have the ADMIN role OR Super Admin OR their cluster has the 'view_admin' permission.
  const isAdmin =
    isSuperAdminPin ||
    (guest as any).cluster?.name === "Super Admin" ||
    (guest as any).guestRoles.some(
      (gr: any) => gr.role?.name?.toUpperCase() === "ADMIN",
    ) ||
    hasAssistanceRoleOrCluster ||
    clusterPermissionNames.some(
      (p) =>
        p.toLowerCase() === "view_admin" || p.toLowerCase() === "view admin",
    );

  const tableName =
    (guest as any).seatingAssignment?.seat?.diningTable?.name || "Unassigned";
  const checkedIn = Boolean((guest as any).checkIn);
  const resolvedCode =
    guest.pin ||
    (Array.isArray((guest as any).qrCode)
      ? (guest as any).qrCode[0]?.code
      : (guest as any).qrCode?.code) ||
    queryCode;

  await createAuditLog({
    actorType: isAdmin ? "ADMIN" : "GUEST",
    actorId: guest.id,
    action: "VERIFY",
    entityType: "GUEST",
    entityId: guest.id,
    metadata: { code: queryCode, checkedIn, role: roleName },
  });

  return {
    id: guest.id,
    name: guest.fullName,
    // title can be an object or an array; normalize to a single name string
    title: (() => {
      const t = (guest as any).title;
      if (!t) return undefined;
      if (Array.isArray(t)) return t[0]?.name || undefined;
      return t.name || undefined;
    })(),
    code: resolvedCode,
    role: roleName,
    table: tableName,
    status: checkedIn ? "CHECKED_IN" : "INVITED",
    checkedIn,
    isAdmin,
    clusterPermissions: clusterPermissionNames,
  };
}

export interface CheckInInput {
  code?: string;
  delegateId?: string;
  tableId?: string | number | null;
  seatNumber?: number | string | null;
}

/**
 * Service function to perform official guest check-in (with optional table assignment).
 * Records operational scan history (`CheckInScan`), updates `CheckIn`, and writes `AuditLog`.
 */
export async function processCheckIn(input: CheckInInput) {
  const { code, delegateId, tableId, seatNumber } = input;

  let guest: any = null;

  if (delegateId) {
    guest = await prisma.guest.findUnique({
      where: { id: String(delegateId) },
      include: includeGuestDetails as any,
    });
  } else if (code) {
    const qrRecord = await prisma.qRCode.findUnique({
      where: { code: String(code).trim() },
      include: {
        guest: {
          include: includeGuestDetails as any,
        },
      },
    });
    guest = qrRecord?.guest || null;
  }

  if (!guest) {
    throw new Error("INVALID_GUEST");
  }

  const alreadyCheckedIn = Boolean(guest.checkIn);
  const scanResult: CheckInScanResult = alreadyCheckedIn
    ? "DUPLICATE"
    : "SUCCESS";

  return await prisma.$transaction(async (tx) => {
    // Optional table/seat assignment logic during check-in
    if (tableId !== undefined && tableId !== null && tableId !== "") {
      const targetTable = await tx.diningTable.findUnique({
        where: { id: String(tableId) },
        include: { seats: { include: { seatingAssignment: true } } },
      });

      if (targetTable) {
        const alreadyHasSeat = targetTable.seats.find(
          (s) => s.seatingAssignment?.guestId === guest.id,
        );

        if (!alreadyHasSeat) {
          let availableSeat = null;
          if (seatNumber) {
            availableSeat = targetTable.seats.find(
              (s) => s.seatNumber === parseInt(String(seatNumber)),
            );
          }
          if (!availableSeat) {
            availableSeat = targetTable.seats.find((s) => !s.seatingAssignment);
          }

          if (!availableSeat) {
            throw new Error(
              `TABLE_FULL:${targetTable.name}:${targetTable.seats.length}`,
            );
          }

          if (guest.seatingAssignment) {
            await tx.seatingAssignment.delete({
              where: { id: guest.seatingAssignment.id },
            });
          }

          const isSeatTaken = await tx.seatingAssignment.findUnique({
            where: { seatId: availableSeat.id },
          });

          if (!isSeatTaken) {
            await tx.seatingAssignment
              .create({
                data: {
                  guestId: guest.id,
                  seatId: availableSeat.id,
                },
              })
              .catch(() => {});
          }
        }
      }
    }

    // 1. Record operational scan history
    await tx.checkInScan.create({
      data: {
        guestId: guest.id,
        result: scanResult,
        scannedAt: new Date(),
        message: alreadyCheckedIn
          ? "Duplicate check-in scan"
          : "Successful check-in",
      },
    });

    // 2. Upsert check-in state
    await tx.checkIn.upsert({
      where: { guestId: guest.id },
      update: { checkedInAt: new Date() },
      create: { guestId: guest.id, checkedInAt: new Date() },
    });

    // 3. Fetch updated guest state
    const updatedGuest = await tx.guest.findUnique({
      where: { id: guest.id },
      include: includeGuestDetails as any,
    });

    const roleName =
      (updatedGuest as any)?.guestRoles?.[0]?.role?.name || "Delegate";
    const tableName =
      (updatedGuest as any)?.seatingAssignment?.seat?.diningTable?.name ||
      "Unassigned";
    const formattedDelegate = formatGuest(updatedGuest);

    // 4. Log Audit inside transaction
    await createAuditLog(
      {
        actorType: roleName.toUpperCase() === "ADMIN" ? "ADMIN" : "GUEST",
        actorId: guest.id,
        action: "CHECK_IN",
        entityType: "CHECK_IN",
        entityId: guest.id,
        metadata: {
          code,
          guestName: guest.fullName,
          role: roleName,
          table: tableName,
          scanResult,
        },
      },
      tx,
    );

    return {
      message: alreadyCheckedIn
        ? "Already checked in (updated timestamp)"
        : "Attendance confirmed!",
      id: updatedGuest?.id,
      name: updatedGuest?.fullName,
      code: guest.qrCode?.code || code,
      role: roleName,
      table: tableName,
      status: "CHECKED_IN",
      checkedIn: true,
      delegate: formattedDelegate,
    };
  });
}

/**
 * Service function to revoke / undo a guest check-in.
 */
export async function revokeCheckIn(input: CheckInInput) {
  const { code, delegateId } = input;
  let guest: any = null;

  if (delegateId) {
    guest = await prisma.guest.findUnique({
      where: { id: String(delegateId) },
      include: includeGuestDetails as any,
    });
  } else if (code) {
    const qrRecord = await prisma.qRCode.findUnique({
      where: { code: String(code).trim() },
      include: {
        guest: {
          include: includeGuestDetails as any,
        },
      },
    });
    guest = qrRecord?.guest || null;
  }

  if (!guest) {
    throw new Error("INVALID_GUEST");
  }

  return await prisma.$transaction(async (tx) => {
    // Delete check-in record
    await tx.checkIn.deleteMany({
      where: { guestId: guest.id },
    });

    const updatedGuest = await tx.guest.findUnique({
      where: { id: guest.id },
      include: includeGuestDetails as any,
    });

    const formattedDelegate = formatGuest(updatedGuest);

    await createAuditLog(
      {
        actorType: "ADMIN",
        actorId: guest.id,
        action: "REMOVE",
        entityType: "CHECK_IN",
        entityId: guest.id,
        metadata: {
          actionDetail: "CHECK_IN_REVOKED",
          code,
          guestName: guest.fullName,
        },
      },
      tx,
    );

    return {
      message: `Check-in revoked for ${guest.fullName}`,
      id: updatedGuest?.id,
      name: updatedGuest?.fullName,
      code: guest.qrCode?.code || code,
      status: "INVITED",
      checkedIn: false,
      delegate: formattedDelegate,
    };
  });
}

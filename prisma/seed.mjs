import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

function resolveConnectionString(url) {
  const fallbackCertPath = "/etc/ssl/certs/rds-ca-bundle.pem";
  const sslCertPath = process.env.SSLROOTCERT || process.env.SSL_CERT_FILE || fallbackCertPath;

  if (!url) {
    return url;
  }

  const normalizedUrl = url.trim();
  const parsed = new URL(normalizedUrl);
  const params = parsed.searchParams;

  if (existsSync(sslCertPath)) {
    params.set("sslmode", "verify-full");
    params.set("sslrootcert", sslCertPath);
    params.set("sslcert", sslCertPath);
    params.set("sslkey", sslCertPath);
    params.set("uselibpqcompat", "true");
  }

  return parsed.toString();
}

const connectionString = resolveConnectionString(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/koito");
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes("sslmode")
    ? {
        rejectUnauthorized: false,
        ca: readFileSync("/etc/ssl/certs/rds-ca-bundle.pem"),
      }
    : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureAuditEnums() {
  const statements = [
    ['AuditAction', 'LOGIN'],
    ['AuditAction', 'LOGIN_FAILED'],
    ['AuditAction', 'LOGOUT'],
    ['AuditAction', 'VERIFY'],
    ['AuditAction', 'VERIFY_FAILED'],
    ['AuditAction', 'RSVP_SUBMIT'],
    ['AuditAction', 'EXPORT'],
    ['AuditAction', 'IMPORT'],
    ['AuditEntityType', 'AUTH'],
    ['AuditEntityType', 'SYSTEM'],
  ];

  for (const [enumName, value] of statements) {
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = '${enumName}' AND e.enumlabel = '${value}'
          ) THEN
            EXECUTE 'ALTER TYPE "${enumName}" ADD VALUE ${JSON.stringify(value)}';
          END IF;
        END $$;
      `);
    } catch (error) {
      console.warn(`⚠️ Could not apply ${enumName} value ${value}:`, error.message || error);
    }
  }

  console.log("✅ Audit enum step completed with warnings if the database rejected the update.");
}

async function main() {
  console.log("🌱 Seeding database...");

  await ensureAuditEnums();

  // 1. Event
  const event = await prisma.event.upsert({
    where: { id: "default-koito-event-2026" },
    update: {},
    create: {
      id: "default-koito-event-2026",
      name: "Koito Annual Gala 2026",
      venue: "Grand Ballroom",
      description: "Official Koito Event & High-Level Gala Dinner",
      startsAt: new Date("2026-09-01T18:00:00Z"),
      endsAt: new Date("2026-09-01T23:00:00Z"),
      status: "ACTIVE",
    },
  });
  console.log(`✅ Event ready: ${event.name} (${event.id})`);

  // 2. Roles (Strictly GUEST, ADMIN, EDITOR)
  const defaultRoles = [
    { name: "GUEST", description: "Default Guest Role" },
    { name: "ADMIN", description: "Full system administration & desk management" },
    { name: "EDITOR", description: "Content and event editor" },
  ];

  for (const r of defaultRoles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log(`✅ Seeded ${defaultRoles.length} standard Roles: GUEST, ADMIN, EDITOR`);

  // 3. Titles (Honorifics)
  const defaultTitles = [
    "H.E.", "Hon.", "Dr.", "Prof.", "Ambassador", "Amb.", "Eng.", "Gen.", "Mr.", "Ms.", "Mrs.", "Miss", "Rev.", "Pastor", "Capt.", "Col.", "Chief", "Elder"
  ];

  for (const name of defaultTitles) {
    await prisma.title.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ Seeded ${defaultTitles.length} standard Titles`);

  // 4. Clusters (Delegations)
  const defaultClusters = [
    { name: "Family", description: "Family members and close relatives" },
    { name: "Diplomats", description: "Ambassadors, Envoys and Diplomatic Corps" },
    { name: "Government Officials", description: "Ministers, Cabinet Secretaries, Governors and State Officials" },
    { name: "Clergy", description: "Bishops, Pastors, Priests and Religious Leaders" },
    { name: "Guests", description: "Honored Guests and General Attendees" },
  ];

  for (const c of defaultClusters) {
    await prisma.cluster.upsert({
      where: { eventId_name: { eventId: event.id, name: c.name } },
      update: { description: c.description },
      create: { eventId: event.id, ...c },
    });
  }
  console.log(`✅ Seeded ${defaultClusters.length} default Clusters`);

  // 5. Admin Guest A000
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });

  const adminGuest = await prisma.guest.upsert({
    where: { eventId_pinFingerprint: { eventId: event.id, pinFingerprint: "A000" } },
    update: { pin: "A000" },
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

  console.log(`✅ System Admin (A000) seeded with ADMIN role & checked in.`);
  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateEnum
CREATE TYPE "CheckInScanResult" AS ENUM ('SUCCESS', 'DUPLICATE', 'INVALID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('GUEST', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'REMOVE', 'CHECK_IN', 'GENERATE', 'REGENERATE');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('EVENT', 'EVENT_CONFIGURATION', 'TITLE', 'CLUSTER', 'ROLE', 'PERMISSION', 'GUEST', 'GUEST_ROLE', 'RSVP', 'DINING_TABLE', 'SEAT', 'SEATING_ASSIGNMENT', 'QR_CODE', 'BADGE', 'CHECK_IN');

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "badgeNumber" VARCHAR(100) NOT NULL,
    "printedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_scans" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "result" "CheckInScanResult" NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_in_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" VARCHAR(255) NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qr_codes_code_idx" ON "qr_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_guestId_key" ON "qr_codes"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_code_key" ON "qr_codes"("code");

-- CreateIndex
CREATE INDEX "badges_badgeNumber_idx" ON "badges"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "badges_guestId_key" ON "badges"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_badgeNumber_key" ON "badges"("badgeNumber");

-- CreateIndex
CREATE INDEX "check_ins_checkedInAt_idx" ON "check_ins"("checkedInAt");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_guestId_key" ON "check_ins"("guestId");

-- CreateIndex
CREATE INDEX "check_in_scans_guestId_idx" ON "check_in_scans"("guestId");

-- CreateIndex
CREATE INDEX "check_in_scans_scannedAt_idx" ON "check_in_scans"("scannedAt");

-- CreateIndex
CREATE INDEX "check_in_scans_result_idx" ON "check_in_scans"("result");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorType_idx" ON "audit_logs"("actorType");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorType_actorId_idx" ON "audit_logs"("actorType", "actorId");

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_scans" ADD CONSTRAINT "check_in_scans_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

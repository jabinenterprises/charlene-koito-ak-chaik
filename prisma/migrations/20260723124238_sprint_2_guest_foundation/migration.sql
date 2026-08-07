-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "titleId" TEXT,
    "clusterId" TEXT,
    "fullName" VARCHAR(255) NOT NULL,
    "pinHash" VARCHAR(255) NOT NULL,
    "pinFingerprint" VARCHAR(64) NOT NULL,
    "organization" VARCHAR(255),
    "position" VARCHAR(255),
    "country" VARCHAR(150),
    "phone" VARCHAR(50),
    "email" VARCHAR(320),
    "dietaryRequirements" TEXT,
    "accessibilityRequirements" TEXT,
    "emergencyContact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication_attempts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT,
    "pinFingerprint" VARCHAR(64) NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authentication_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_roles" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guests_eventId_idx" ON "guests"("eventId");

-- CreateIndex
CREATE INDEX "guests_titleId_idx" ON "guests"("titleId");

-- CreateIndex
CREATE INDEX "guests_clusterId_idx" ON "guests"("clusterId");

-- CreateIndex
CREATE INDEX "guests_fullName_idx" ON "guests"("fullName");

-- CreateIndex
CREATE INDEX "guests_pinFingerprint_idx" ON "guests"("pinFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "guests_eventId_pinFingerprint_key" ON "guests"("eventId", "pinFingerprint");

-- CreateIndex
CREATE INDEX "authentication_attempts_eventId_idx" ON "authentication_attempts"("eventId");

-- CreateIndex
CREATE INDEX "authentication_attempts_guestId_idx" ON "authentication_attempts"("guestId");

-- CreateIndex
CREATE INDEX "authentication_attempts_pinFingerprint_idx" ON "authentication_attempts"("pinFingerprint");

-- CreateIndex
CREATE INDEX "authentication_attempts_successful_idx" ON "authentication_attempts"("successful");

-- CreateIndex
CREATE INDEX "authentication_attempts_attemptedAt_idx" ON "authentication_attempts"("attemptedAt");

-- CreateIndex
CREATE INDEX "authentication_attempts_eventId_attemptedAt_idx" ON "authentication_attempts"("eventId", "attemptedAt");

-- CreateIndex
CREATE INDEX "guest_roles_guestId_idx" ON "guest_roles"("guestId");

-- CreateIndex
CREATE INDEX "guest_roles_roleId_idx" ON "guest_roles"("roleId");

-- CreateIndex
CREATE INDEX "guest_roles_eventId_idx" ON "guest_roles"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_roles_guestId_roleId_eventId_key" ON "guest_roles"("guestId", "roleId", "eventId");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_attempts" ADD CONSTRAINT "authentication_attempts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_attempts" ADD CONSTRAINT "authentication_attempts_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_roles" ADD CONSTRAINT "guest_roles_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_roles" ADD CONSTRAINT "guest_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_roles" ADD CONSTRAINT "guest_roles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

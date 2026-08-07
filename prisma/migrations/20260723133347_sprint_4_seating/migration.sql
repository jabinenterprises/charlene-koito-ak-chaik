-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('ATTENDING', 'NOT_ATTENDING', 'PENDING');

-- CreateTable
CREATE TABLE "rsvps" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "guestNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "diningTableId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seating_assignments" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seating_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rsvps_status_idx" ON "rsvps"("status");

-- CreateIndex
CREATE INDEX "rsvps_respondedAt_idx" ON "rsvps"("respondedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_guestId_key" ON "rsvps"("guestId");

-- CreateIndex
CREATE INDEX "dining_tables_eventId_idx" ON "dining_tables"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_eventId_name_key" ON "dining_tables"("eventId", "name");

-- CreateIndex
CREATE INDEX "seats_diningTableId_idx" ON "seats"("diningTableId");

-- CreateIndex
CREATE UNIQUE INDEX "seats_diningTableId_seatNumber_key" ON "seats"("diningTableId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "seating_assignments_guestId_key" ON "seating_assignments"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "seating_assignments_seatId_key" ON "seating_assignments"("seatId");

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_diningTableId_fkey" FOREIGN KEY ("diningTableId") REFERENCES "dining_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seating_assignments" ADD CONSTRAINT "seating_assignments_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seating_assignments" ADD CONSTRAINT "seating_assignments_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

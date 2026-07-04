-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REGION_MANAGER', 'RIDER_MANAGER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('RECEPTION', 'LINKED', 'UNLINKED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('LEVE', 'BLOCKING');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_WORKSHOP', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('BACKOFFICE', 'RIDER');

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moto" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Moto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionClient" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "RegionClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rider" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotoClientAssignment" (
    "id" TEXT NOT NULL,
    "motoId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "isSubstitution" BOOLEAN NOT NULL DEFAULT false,
    "seatCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotoClientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotoRiderAssignment" (
    "id" TEXT NOT NULL,
    "motoId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "receptionAt" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'RECEPTION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAt" TIMESTAMP(3),
    "unlinkedAt" TIMESTAMP(3),

    CONSTRAINT "MotoRiderAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentCatalog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "motoId" TEXT NOT NULL,
    "riderId" TEXT,
    "catalogId" TEXT,
    "photoUrl" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "workshopAppointmentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatteryStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "batteriesAbove80" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatteryStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "motoId" TEXT NOT NULL,
    "currentKm" INTEGER NOT NULL DEFAULT 0,
    "nextMaintenanceKm" INTEGER NOT NULL DEFAULT 10000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackofficeUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "regionId" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackofficeUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE INDEX "Address_regionId_idx" ON "Address"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Moto_plate_key" ON "Moto"("plate");

-- CreateIndex
CREATE INDEX "Moto_regionId_idx" ON "Moto"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE INDEX "RegionClient_clientId_idx" ON "RegionClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "RegionClient_regionId_clientId_key" ON "RegionClient"("regionId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_email_key" ON "Rider"("email");

-- CreateIndex
CREATE INDEX "Rider_clientId_idx" ON "Rider"("clientId");

-- CreateIndex
CREATE INDEX "Rider_regionId_idx" ON "Rider"("regionId");

-- CreateIndex
CREATE INDEX "MotoClientAssignment_clientId_regionId_idx" ON "MotoClientAssignment"("clientId", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "MotoClientAssignment_motoId_key" ON "MotoClientAssignment"("motoId");

-- CreateIndex
CREATE INDEX "MotoRiderAssignment_motoId_idx" ON "MotoRiderAssignment"("motoId");

-- CreateIndex
CREATE INDEX "MotoRiderAssignment_riderId_idx" ON "MotoRiderAssignment"("riderId");

-- CreateIndex
CREATE INDEX "IncidentCatalog_clientId_idx" ON "IncidentCatalog"("clientId");

-- CreateIndex
CREATE INDEX "Ticket_motoId_idx" ON "Ticket"("motoId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenancePlan_motoId_key" ON "MaintenancePlan"("motoId");

-- CreateIndex
CREATE UNIQUE INDEX "BackofficeUser_email_key" ON "BackofficeUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moto" ADD CONSTRAINT "Moto_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionClient" ADD CONSTRAINT "RegionClient_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionClient" ADD CONSTRAINT "RegionClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rider" ADD CONSTRAINT "Rider_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoClientAssignment" ADD CONSTRAINT "MotoClientAssignment_motoId_fkey" FOREIGN KEY ("motoId") REFERENCES "Moto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoClientAssignment" ADD CONSTRAINT "MotoClientAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoClientAssignment" ADD CONSTRAINT "MotoClientAssignment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoRiderAssignment" ADD CONSTRAINT "MotoRiderAssignment_motoId_fkey" FOREIGN KEY ("motoId") REFERENCES "Moto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotoRiderAssignment" ADD CONSTRAINT "MotoRiderAssignment_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentCatalog" ADD CONSTRAINT "IncidentCatalog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_motoId_fkey" FOREIGN KEY ("motoId") REFERENCES "Moto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "IncidentCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_motoId_fkey" FOREIGN KEY ("motoId") REFERENCES "Moto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackofficeUser" ADD CONSTRAINT "BackofficeUser_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

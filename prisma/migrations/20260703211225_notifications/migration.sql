-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TICKET_CLOSED', 'WORKSHOP_APPOINTMENT', 'GENERIC');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERIC',
    "message" TEXT NOT NULL,
    "ticketId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_riderId_idx" ON "Notification"("riderId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

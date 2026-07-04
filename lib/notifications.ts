import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

/**
 * Notificacions in-app per al rider (canal v1 = push web, llegit des de l'app).
 * Es poden ampliar a email/SMS més endavant sense canviar els cridants.
 */
export async function notifyRider(
  riderId: string,
  type: NotificationType,
  message: string,
  ticketId?: string
) {
  await db.notification.create({
    data: { riderId, type, message, ticketId },
  });
}

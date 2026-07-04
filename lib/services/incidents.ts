import { db } from "@/lib/db";
import { notifyRider } from "@/lib/notifications";
import { generateSeatCode } from "@/lib/auth";

export type Result = { ok?: boolean; error?: string };

/**
 * Crea un ticket d'incidència a partir d'una entrada del catàleg del client.
 * Si la incidència és BLOCKING, la moto queda bloquejada (té un ticket
 * bloquejant obert) i el rider podrà accedir a un vehicle de substitució.
 */
export async function createTicket(input: {
  motoId: string;
  riderId?: string;
  catalogId: string;
  photoUrl?: string;
}): Promise<Result & { blocking?: boolean }> {
  const catalog = await db.incidentCatalog.findUnique({
    where: { id: input.catalogId },
  });
  if (!catalog) return { error: "Tipus d'incidència no vàlid." };

  await db.ticket.create({
    data: {
      motoId: input.motoId,
      riderId: input.riderId,
      catalogId: input.catalogId,
      photoUrl: input.photoUrl,
      status: "OPEN",
    },
  });

  return { ok: true, blocking: catalog.type === "BLOCKING" };
}

/** Una moto està bloquejada si té un ticket bloquejant no tancat. */
export async function isMotoBlocked(motoId: string): Promise<boolean> {
  const t = await db.ticket.findFirst({
    where: {
      motoId,
      status: { not: "CLOSED" },
      catalog: { type: "BLOCKING" },
    },
  });
  return t !== null;
}

export async function moveTicketToWorkshop(ticketId: string): Promise<Result> {
  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "IN_WORKSHOP" },
  });
  return { ok: true };
}

export async function setWorkshopAppointment(
  ticketId: string,
  at: Date
): Promise<Result> {
  const ticket = await db.ticket.update({
    where: { id: ticketId },
    data: { workshopAppointmentAt: at },
  });
  if (ticket.riderId) {
    await notifyRider(
      ticket.riderId,
      "WORKSHOP_APPOINTMENT",
      `Cita de taller: ${at.toLocaleString("ca-ES")}`,
      ticket.id
    );
  }
  return { ok: true };
}

/** Tanca el ticket i avisa el rider que la moto està disponible per recollir. */
export async function closeTicket(ticketId: string): Promise<Result> {
  const ticket = await db.ticket.update({
    where: { id: ticketId },
    data: { status: "CLOSED", closedAt: new Date() },
    include: { moto: true },
  });
  if (ticket.riderId) {
    await notifyRider(
      ticket.riderId,
      "TICKET_CLOSED",
      `La moto ${ticket.moto.plate} ja està reparada i disponible per recollir.`,
      ticket.id
    );
  }
  return { ok: true };
}

/** Genera un codi de 5 dígits per a un vehicle de substitució. */
export async function generateSeatCodeForMoto(motoId: string): Promise<
  Result & { code?: string }
> {
  const assignment = await db.motoClientAssignment.findUnique({
    where: { motoId },
  });
  if (!assignment) return { error: "La moto no està assignada a cap client." };
  if (!assignment.isSubstitution) {
    return { error: "Només les motos de substitució tenen codi d'obrir seient." };
  }
  const code = generateSeatCode();
  await db.motoClientAssignment.update({
    where: { motoId },
    data: { seatCode: code },
  });
  return { ok: true, code };
}

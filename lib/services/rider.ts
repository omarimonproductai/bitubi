import { db } from "@/lib/db";
import { isMotoBlocked } from "@/lib/services/incidents";

export type Result = { ok?: boolean; error?: string };

/** Assignació activa del rider (RECEPTION o LINKED) amb la moto. */
export async function getActiveAssignment(riderId: string) {
  return db.motoRiderAssignment.findFirst({
    where: { riderId, status: { in: ["RECEPTION", "LINKED"] } },
    include: {
      moto: {
        include: {
          region: { include: { addresses: true } },
          clientAssignments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Vehicles de substitució disponibles per al client+regió del rider. */
export async function getSubstitutionMotos(riderId: string) {
  const rider = await db.rider.findUnique({ where: { id: riderId } });
  if (!rider) return [];

  const subs = await db.motoClientAssignment.findMany({
    where: {
      isSubstitution: true,
      clientId: rider.clientId,
      regionId: rider.regionId,
    },
    include: { moto: true },
  });

  // Exclou les que ja tenen una assignació activa d'un altre rider.
  const result = [];
  for (const s of subs) {
    const active = await db.motoRiderAssignment.findFirst({
      where: { motoId: s.motoId, status: { in: ["RECEPTION", "LINKED"] } },
    });
    if (!active) result.push(s);
  }
  return result;
}

/**
 * Auto-assignació d'un vehicle de substitució pel propi rider.
 * Només si el rider no té cap vehicle actiu i la moto és de substitució
 * del seu client+regió i està lliure.
 */
export async function selfAssignSubstitution(
  riderId: string,
  motoId: string
): Promise<Result> {
  const rider = await db.rider.findUnique({ where: { id: riderId } });
  if (!rider) return { error: "Rider no trobat." };

  const existing = await getActiveAssignment(riderId);
  if (existing) return { error: "Ja tens un vehicle assignat." };

  const ca = await db.motoClientAssignment.findUnique({ where: { motoId } });
  if (
    !ca ||
    !ca.isSubstitution ||
    ca.clientId !== rider.clientId ||
    ca.regionId !== rider.regionId
  ) {
    return { error: "Aquest vehicle de substitució no està disponible per a tu." };
  }

  const taken = await db.motoRiderAssignment.findFirst({
    where: { motoId, status: { in: ["RECEPTION", "LINKED"] } },
  });
  if (taken) return { error: "Aquest vehicle ja està agafat." };

  await db.motoRiderAssignment.create({
    data: { motoId, riderId, receptionAt: new Date(), status: "LINKED", linkedAt: new Date() },
  });
  return { ok: true };
}

/** Valida el codi de 5 dígits per obrir el seient d'un vehicle de substitució. */
export async function openSeat(
  riderId: string,
  code: string
): Promise<Result> {
  const assignment = await getActiveAssignment(riderId);
  if (!assignment) return { error: "No tens cap vehicle assignat." };

  const ca = assignment.moto.clientAssignments[0];
  if (!ca?.isSubstitution) {
    return { error: "El teu vehicle no requereix codi d'obrir seient." };
  }
  if (!ca.seatCode) {
    return { error: "Encara no hi ha codi generat. Contacta amb Cooltra." };
  }
  if (ca.seatCode !== code) return { error: "Codi incorrecte." };
  return { ok: true };
}

/** El rider deixa (desvincula) el seu vehicle actual. */
export async function leaveVehicle(riderId: string): Promise<Result> {
  const assignment = await getActiveAssignment(riderId);
  if (!assignment) return { error: "No tens cap vehicle per deixar." };
  await db.motoRiderAssignment.update({
    where: { id: assignment.id },
    data: { status: "UNLINKED", unlinkedAt: new Date() },
  });
  return { ok: true };
}

/** El rider reporta una incidència sobre el seu vehicle actual. */
export async function reportRiderIncident(
  riderId: string,
  catalogId: string,
  photoUrl?: string
): Promise<Result> {
  const assignment = await getActiveAssignment(riderId);
  if (!assignment) return { error: "No tens cap vehicle per reportar." };
  const { createTicket } = await import("@/lib/services/incidents");
  const res = await createTicket({
    motoId: assignment.motoId,
    riderId,
    catalogId,
    photoUrl,
  });
  return res;
}

export { isMotoBlocked };

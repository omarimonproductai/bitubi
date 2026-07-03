import { db } from "@/lib/db";
import { clientOperatesInRegion } from "@/lib/services/fleet";

export type Result = { ok?: boolean; error?: string };

/**
 * Assigna (o reassigna) una moto a un client dins de la regió de la moto,
 * marcant si és de substitució. Regla: el client ha d'operar en aquella regió.
 */
export async function assignMotoToClient(
  motoId: string,
  clientId: string,
  isSubstitution: boolean
): Promise<Result> {
  const moto = await db.moto.findUnique({ where: { id: motoId } });
  if (!moto) return { error: "Moto no trobada." };

  if (!(await clientOperatesInRegion(clientId, moto.regionId))) {
    return { error: "El client no opera en la regió d'aquesta moto." };
  }

  await db.motoClientAssignment.upsert({
    where: { motoId },
    update: { clientId, regionId: moto.regionId, isSubstitution },
    create: { motoId, clientId, regionId: moto.regionId, isSubstitution },
  });
  return { ok: true };
}

/** Treu l'assignació moto→client (si no té assignació de rider activa). */
export async function unassignMotoFromClient(motoId: string): Promise<Result> {
  const active = await db.motoRiderAssignment.findFirst({
    where: { motoId, status: { in: ["RECEPTION", "LINKED"] } },
  });
  if (active) {
    return {
      error: "La moto té una assignació de rider activa; desvincula-la abans.",
    };
  }
  await db.motoClientAssignment.deleteMany({ where: { motoId } });
  return { ok: true };
}

/**
 * Assigna una moto a un rider amb dia/hora de recepció (estat RECEPTION).
 * Regles: el rider i la moto han de coincidir en client (via assignació
 * moto→client) i regió, i la moto no pot tenir ja una assignació activa.
 */
export async function assignMotoToRider(
  motoId: string,
  riderId: string,
  receptionAt: Date
): Promise<Result> {
  const [moto, rider, clientAssignment] = await Promise.all([
    db.moto.findUnique({ where: { id: motoId } }),
    db.rider.findUnique({ where: { id: riderId } }),
    db.motoClientAssignment.findUnique({ where: { motoId } }),
  ]);

  if (!moto || !rider) return { error: "Moto o rider no trobats." };
  if (!clientAssignment) {
    return { error: "La moto no està assignada a cap client." };
  }
  if (clientAssignment.isSubstitution) {
    return {
      error:
        "Aquesta moto és de substitució; s'auto-assigna des de l'app del rider.",
    };
  }
  if (rider.regionId !== moto.regionId) {
    return { error: "El rider i la moto no són de la mateixa regió." };
  }
  if (rider.clientId !== clientAssignment.clientId) {
    return { error: "El rider i la moto no són del mateix client." };
  }

  const active = await db.motoRiderAssignment.findFirst({
    where: { motoId, status: { in: ["RECEPTION", "LINKED"] } },
  });
  if (active) return { error: "La moto ja té una assignació activa." };

  const riderActive = await db.motoRiderAssignment.findFirst({
    where: { riderId, status: { in: ["RECEPTION", "LINKED"] } },
  });
  if (riderActive) {
    return { error: "El rider ja té una moto assignada." };
  }

  await db.motoRiderAssignment.create({
    data: { motoId, riderId, receptionAt, status: "RECEPTION" },
  });
  return { ok: true };
}

/** Vinculació definitiva: RECEPTION → LINKED. */
export async function linkAssignment(assignmentId: string): Promise<Result> {
  const a = await db.motoRiderAssignment.findUnique({ where: { id: assignmentId } });
  if (!a) return { error: "Assignació no trobada." };
  if (a.status !== "RECEPTION") {
    return { error: "Només es pot vincular una assignació en recepció." };
  }
  await db.motoRiderAssignment.update({
    where: { id: assignmentId },
    data: { status: "LINKED", linkedAt: new Date() },
  });
  return { ok: true };
}

/** Desvinculació immediata: RECEPTION|LINKED → UNLINKED. */
export async function unlinkAssignment(assignmentId: string): Promise<Result> {
  const a = await db.motoRiderAssignment.findUnique({ where: { id: assignmentId } });
  if (!a) return { error: "Assignació no trobada." };
  if (a.status === "UNLINKED") return { ok: true };
  await db.motoRiderAssignment.update({
    where: { id: assignmentId },
    data: { status: "UNLINKED", unlinkedAt: new Date() },
  });
  return { ok: true };
}

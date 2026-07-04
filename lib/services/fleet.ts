import { db } from "@/lib/db";

/**
 * Regles d'integritat de flota compartides entre backoffice i app del rider.
 */

/** Retorna l'assignació moto→rider actualment vinculada (LINKED), si n'hi ha. */
export async function getLinkedAssignment(motoId: string) {
  return db.motoRiderAssignment.findFirst({
    where: { motoId, status: "LINKED" },
    include: { rider: true },
  });
}

/** Una moto està "vinculada" si té una assignació en estat LINKED. */
export async function isMotoLinked(motoId: string): Promise<boolean> {
  const linked = await getLinkedAssignment(motoId);
  return linked !== null;
}

/**
 * Una moto amb rider vinculat no es pot canviar de regió.
 * Retorna true si es pot canviar (no hi ha vinculació activa).
 */
export async function canChangeMotoRegion(motoId: string): Promise<boolean> {
  return !(await isMotoLinked(motoId));
}

/**
 * Comprova que un client opera en una regió (existeix relació Regió-Client).
 */
export async function clientOperatesInRegion(
  clientId: string,
  regionId: string
): Promise<boolean> {
  const rel = await db.regionClient.findUnique({
    where: { regionId_clientId: { regionId, clientId } },
  });
  return rel !== null;
}

import { db } from "@/lib/db";

const DEFAULT_INTERVAL_KM = 10000;

/**
 * Mantenim ent dinàmic: després d'una intervenció, es registren els km reals
 * i es recalcula el proper manteniment (km actuals + interval).
 * Nota: la font dels km reals està pendent de definir (Open Question del PRD);
 * de moment s'introdueixen manualment.
 */
export async function recalculateMaintenance(
  motoId: string,
  currentKm: number,
  interval = DEFAULT_INTERVAL_KM
) {
  return db.maintenancePlan.upsert({
    where: { motoId },
    update: { currentKm, nextMaintenanceKm: currentKm + interval },
    create: {
      motoId,
      currentKm,
      nextMaintenanceKm: currentKm + interval,
    },
  });
}

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { notifyRider } from "@/lib/notifications";

export type CommsState = { ok?: boolean; error?: string; sent?: number };

const schema = z.object({
  regionId: z.string().min(1, "Selecciona una regió"),
  clientId: z.string().optional(),
  message: z.string().trim().min(1, "Escriu un missatge"),
});

export async function sendCommsAction(
  _prev: CommsState,
  formData: FormData
): Promise<CommsState> {
  await requirePermission("comms:write");
  const parsed = schema.safeParse({
    regionId: formData.get("regionId"),
    clientId: formData.get("clientId") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { regionId, clientId, message } = parsed.data;

  const riders = await db.rider.findMany({
    where: {
      status: "ACTIVE",
      regionId,
      ...(clientId ? { clientId } : {}),
    },
  });

  if (riders.length === 0) return { error: "Cap rider coincideix amb el filtre." };

  await Promise.all(
    riders.map((r) => notifyRider(r.id, "GENERIC", message))
  );

  return { ok: true, sent: riders.length };
}

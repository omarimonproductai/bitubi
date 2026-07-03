"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/guards";
import { recalculateMaintenance } from "@/lib/services/maintenance";
import type { ActionState } from "@/components/backoffice/entity-dialog";

const schema = z.object({
  motoId: z.string().min(1),
  currentKm: z.coerce.number().int().min(0, "Km no vàlids"),
});

export async function updateKmAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("maintenance:write");
  const parsed = schema.safeParse({
    motoId: formData.get("motoId"),
    currentKm: formData.get("currentKm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await recalculateMaintenance(parsed.data.motoId, parsed.data.currentKm);
  revalidatePath("/backoffice/maintenance");
  return { ok: true };
}

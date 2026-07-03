"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { canChangeMotoRegion } from "@/lib/services/fleet";
import type { ActionState } from "@/components/backoffice/entity-dialog";

const schema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, "La matrícula és obligatòria")
    .transform((s) => s.toUpperCase()),
  regionId: z.string().min(1, "Selecciona una regió"),
});

export async function createMoto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("motos:write");
  const parsed = schema.safeParse({
    plate: formData.get("plate"),
    regionId: formData.get("regionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await db.moto.findUnique({ where: { plate: parsed.data.plate } });
  if (exists) return { error: "Ja existeix una moto amb aquesta matrícula." };

  await db.moto.create({ data: parsed.data });
  revalidatePath("/backoffice/motos");
  return { ok: true };
}

export async function updateMoto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("motos:write");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    plate: formData.get("plate"),
    regionId: formData.get("regionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const moto = await db.moto.findUnique({ where: { id } });
  if (!moto) return { error: "Moto no trobada." };

  // Regla: una moto amb rider vinculat no es pot moure de regió.
  if (moto.regionId !== parsed.data.regionId) {
    const allowed = await canChangeMotoRegion(id);
    if (!allowed) {
      return {
        error:
          "Aquesta moto té un rider vinculat i no es pot canviar de regió.",
      };
    }
  }

  const other = await db.moto.findUnique({ where: { plate: parsed.data.plate } });
  if (other && other.id !== id) {
    return { error: "Ja existeix una moto amb aquesta matrícula." };
  }

  await db.moto.update({ where: { id }, data: parsed.data });
  revalidatePath("/backoffice/motos");
  return { ok: true };
}

export async function toggleMotoStatus(id: string, next: boolean) {
  await requirePermission("motos:write");
  await db.moto.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/motos");
}

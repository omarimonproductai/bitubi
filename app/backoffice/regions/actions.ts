"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import type { ActionState } from "@/components/backoffice/entity-dialog";

const schema = z.object({ name: z.string().trim().min(1, "El nom és obligatori") });

export async function createRegion(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("regions:write");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await db.region.findUnique({
    where: { name: parsed.data.name },
  });
  if (exists) return { error: "Ja existeix una regió amb aquest nom." };

  await db.region.create({ data: { name: parsed.data.name } });
  revalidatePath("/backoffice/regions");
  return { ok: true };
}

export async function updateRegion(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("regions:write");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.region.update({
    where: { id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/backoffice/regions");
  return { ok: true };
}

export async function toggleRegionStatus(id: string, next: boolean) {
  await requirePermission("regions:write");
  await db.region.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/regions");
}

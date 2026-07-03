"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import type { ActionState } from "@/components/backoffice/entity-dialog";

const schema = z.object({ name: z.string().trim().min(1, "El nom és obligatori") });

export async function createClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("clients:write");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const exists = await db.client.findUnique({ where: { name: parsed.data.name } });
  if (exists) return { error: "Ja existeix un client amb aquest nom." };

  await db.client.create({ data: { name: parsed.data.name } });
  revalidatePath("/backoffice/clients");
  return { ok: true };
}

export async function updateClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("clients:write");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.client.update({ where: { id }, data: { name: parsed.data.name } });
  revalidatePath("/backoffice/clients");
  return { ok: true };
}

export async function toggleClientStatus(id: string, next: boolean) {
  await requirePermission("clients:write");
  await db.client.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/clients");
}

/** Estableix les regions on opera un client (relació Regió-Client). */
export async function setClientRegions(
  clientId: string,
  regionIds: string[]
): Promise<ActionState> {
  await requirePermission("clients:write");

  const current = await db.regionClient.findMany({ where: { clientId } });
  const currentIds = new Set(current.map((c) => c.regionId));
  const nextIds = new Set(regionIds);

  const toAdd = regionIds.filter((id) => !currentIds.has(id));
  const toRemove = current.filter((c) => !nextIds.has(c.regionId));

  // No permetre treure una regió si el client hi té riders.
  for (const rel of toRemove) {
    const riders = await db.rider.count({
      where: { clientId, regionId: rel.regionId },
    });
    if (riders > 0) {
      const region = await db.region.findUnique({ where: { id: rel.regionId } });
      return {
        error: `No es pot treure ${region?.name}: el client hi té ${riders} rider(s).`,
      };
    }
  }

  await db.$transaction([
    db.regionClient.deleteMany({
      where: { clientId, regionId: { in: toRemove.map((r) => r.regionId) } },
    }),
    ...toAdd.map((regionId) =>
      db.regionClient.create({ data: { clientId, regionId } })
    ),
  ]);

  revalidatePath("/backoffice/clients");
  return { ok: true };
}

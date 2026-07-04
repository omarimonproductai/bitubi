"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import type { ActionState } from "@/components/backoffice/entity-dialog";

const schema = z.object({
  regionId: z.string().min(1, "Selecciona una regió"),
  name: z.string().trim().min(1, "El nom és obligatori"),
  street: z.string().trim().min(1, "El carrer és obligatori"),
  postcode: z.string().trim().min(1, "El codi postal és obligatori"),
  city: z.string().trim().min(1, "La ciutat és obligatòria"),
});

function parse(formData: FormData) {
  return schema.safeParse({
    regionId: formData.get("regionId"),
    name: formData.get("name"),
    street: formData.get("street"),
    postcode: formData.get("postcode"),
    city: formData.get("city"),
  });
}

export async function createAddress(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("addresses:write");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.address.create({ data: parsed.data });
  revalidatePath("/backoffice/addresses");
  return { ok: true };
}

export async function updateAddress(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("addresses:write");
  const id = String(formData.get("id") ?? "");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.address.update({ where: { id }, data: parsed.data });
  revalidatePath("/backoffice/addresses");
  return { ok: true };
}

export async function toggleAddressStatus(id: string, next: boolean) {
  await requirePermission("addresses:write");
  await db.address.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/addresses");
}

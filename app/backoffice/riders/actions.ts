"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import {
  generateRandomPassword,
  hashPassword,
} from "@/lib/auth";
import { clientOperatesInRegion } from "@/lib/services/fleet";

export type RiderActionState = {
  ok?: boolean;
  error?: string;
  password?: string;
  email?: string;
};

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email no vàlid"),
  clientId: z.string().min(1, "Selecciona un client"),
  regionId: z.string().min(1, "Selecciona una regió"),
});

export async function createRider(
  _prev: RiderActionState,
  formData: FormData
): Promise<RiderActionState> {
  await requirePermission("riders:write");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    clientId: formData.get("clientId"),
    regionId: formData.get("regionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, clientId, regionId } = parsed.data;

  const exists = await db.rider.findUnique({ where: { email } });
  if (exists) return { error: "Ja existeix un rider amb aquest email." };

  if (!(await clientOperatesInRegion(clientId, regionId))) {
    return { error: "El client no opera en aquesta regió." };
  }

  // El password el genera aleatòriament el sistema (email no verificable).
  const password = generateRandomPassword();
  await db.rider.create({
    data: { email, clientId, regionId, passwordHash: await hashPassword(password) },
  });

  revalidatePath("/backoffice/riders");
  return { ok: true, password, email };
}

export async function updateRider(
  _prev: RiderActionState,
  formData: FormData
): Promise<RiderActionState> {
  await requirePermission("riders:write");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    clientId: formData.get("clientId"),
    regionId: formData.get("regionId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, clientId, regionId } = parsed.data;

  if (!(await clientOperatesInRegion(clientId, regionId))) {
    return { error: "El client no opera en aquesta regió." };
  }

  const other = await db.rider.findUnique({ where: { email } });
  if (other && other.id !== id) {
    return { error: "Ja existeix un rider amb aquest email." };
  }

  await db.rider.update({ where: { id }, data: { email, clientId, regionId } });
  revalidatePath("/backoffice/riders");
  return { ok: true };
}

export async function regeneratePassword(
  riderId: string
): Promise<RiderActionState> {
  await requirePermission("riders:write");
  const rider = await db.rider.findUnique({ where: { id: riderId } });
  if (!rider) return { error: "Rider no trobat." };
  const password = generateRandomPassword();
  await db.rider.update({
    where: { id: riderId },
    data: { passwordHash: await hashPassword(password) },
  });
  return { ok: true, password, email: rider.email };
}

export async function toggleRiderStatus(id: string, next: boolean) {
  await requirePermission("riders:write");
  await db.rider.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/riders");
}

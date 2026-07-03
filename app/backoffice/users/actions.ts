"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { generateRandomPassword, hashPassword } from "@/lib/auth";

export type UserActionState = {
  ok?: boolean;
  error?: string;
  password?: string;
  email?: string;
};

const schema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email no vàlid"),
    role: z.enum(["ADMIN", "REGION_MANAGER", "RIDER_MANAGER"]),
    regionId: z.string().optional(),
  })
  .refine((d) => d.role !== "REGION_MANAGER" || !!d.regionId, {
    message: "Un responsable de regió necessita una regió",
    path: ["regionId"],
  });

export async function createUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requirePermission("users:write");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    regionId: formData.get("regionId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role, regionId } = parsed.data;

  const exists = await db.backofficeUser.findUnique({ where: { email } });
  if (exists) return { error: "Ja existeix un usuari amb aquest email." };

  const password = generateRandomPassword();
  await db.backofficeUser.create({
    data: {
      email,
      role,
      regionId: role === "REGION_MANAGER" ? regionId : null,
      passwordHash: await hashPassword(password),
    },
  });
  revalidatePath("/backoffice/users");
  return { ok: true, password, email };
}

export async function updateUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requirePermission("users:write");
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    regionId: formData.get("regionId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, role, regionId } = parsed.data;

  const other = await db.backofficeUser.findUnique({ where: { email } });
  if (other && other.id !== id) {
    return { error: "Ja existeix un usuari amb aquest email." };
  }

  await db.backofficeUser.update({
    where: { id },
    data: { email, role, regionId: role === "REGION_MANAGER" ? regionId : null },
  });
  revalidatePath("/backoffice/users");
  return { ok: true };
}

export async function toggleUserStatus(id: string, next: boolean) {
  await requirePermission("users:write");
  await db.backofficeUser.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/users");
}

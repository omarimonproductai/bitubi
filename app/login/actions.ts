"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginBackoffice(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introdueix l'email i la contrasenya." };
  }

  const user = await db.backofficeUser.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    return { error: "Credencials incorrectes." };
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return { error: "Credencials incorrectes." };

  await createSession("BACKOFFICE", user.id);
  redirect("/backoffice");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

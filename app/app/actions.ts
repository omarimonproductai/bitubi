"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { requireRider } from "@/lib/guards";
import { saveUploadedPhoto } from "@/lib/storage";
import {
  selfAssignSubstitution,
  openSeat,
  leaveVehicle,
  reportRiderIncident,
  type Result,
} from "@/lib/services/rider";

export type LoginState = { error?: string };

export async function loginRider(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Introdueix email i password." };

  const rider = await db.rider.findUnique({ where: { email } });
  if (!rider || rider.status !== "ACTIVE") {
    return { error: "Credencials incorrectes." };
  }
  const ok = await verifyPassword(rider.passwordHash, password);
  if (!ok) return { error: "Credencials incorrectes." };

  await createSession("RIDER", rider.id);
  redirect("/app");
}

export async function logoutRider() {
  await destroySession();
  redirect("/app/login");
}

export async function leaveVehicleAction() {
  const rider = await requireRider();
  await leaveVehicle(rider.id);
  revalidatePath("/app");
}

export async function selfAssignAction(motoId: string) {
  const rider = await requireRider();
  await selfAssignSubstitution(rider.id, motoId);
  revalidatePath("/app");
  revalidatePath("/app/substitution");
}

export async function openSeatAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const rider = await requireRider();
  const code = String(formData.get("code") ?? "");
  if (!/^\d{5}$/.test(code)) return { error: "El codi ha de tenir 5 dígits." };
  return openSeat(rider.id, code);
}

export async function reportIncidentAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const rider = await requireRider();
  const catalogId = String(formData.get("catalogId") ?? "");
  if (!catalogId) return { error: "Selecciona una incidència." };
  const file = formData.get("photo");
  let photoUrl: string | undefined;
  if (file instanceof File && file.size > 0) {
    photoUrl = (await saveUploadedPhoto(file)) ?? undefined;
  }
  const res = await reportRiderIncident(rider.id, catalogId, photoUrl);
  if (res.ok) revalidatePath("/app");
  return res;
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/guards";
import {
  assignMotoToClient,
  assignMotoToRider,
  linkAssignment,
  unlinkAssignment,
  unassignMotoFromClient,
  type Result,
} from "@/lib/services/assignments";

export async function assignClientAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  await requirePermission("assignments:write");
  const motoId = String(formData.get("motoId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const isSubstitution = formData.get("isSubstitution") === "on";
  if (!motoId || !clientId) return { error: "Falten dades." };
  const res = await assignMotoToClient(motoId, clientId, isSubstitution);
  if (res.ok) revalidatePath("/backoffice/assignments");
  return res;
}

export async function assignRiderAction(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  await requirePermission("assignments:write");
  const motoId = String(formData.get("motoId") ?? "");
  const riderId = String(formData.get("riderId") ?? "");
  const receptionRaw = String(formData.get("receptionAt") ?? "");
  if (!motoId || !riderId || !receptionRaw) return { error: "Falten dades." };
  const receptionAt = new Date(receptionRaw);
  if (isNaN(receptionAt.getTime())) return { error: "Data de recepció no vàlida." };
  const res = await assignMotoToRider(motoId, riderId, receptionAt);
  if (res.ok) revalidatePath("/backoffice/assignments");
  return res;
}

export async function linkAction(assignmentId: string) {
  await requirePermission("assignments:write");
  await linkAssignment(assignmentId);
  revalidatePath("/backoffice/assignments");
}

export async function unlinkAction(assignmentId: string) {
  await requirePermission("assignments:write");
  await unlinkAssignment(assignmentId);
  revalidatePath("/backoffice/assignments");
}

export async function unassignClientAction(motoId: string) {
  await requirePermission("assignments:write");
  await unassignMotoFromClient(motoId);
  revalidatePath("/backoffice/assignments");
}

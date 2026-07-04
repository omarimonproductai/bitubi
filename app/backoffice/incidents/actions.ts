"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import {
  closeTicket,
  moveTicketToWorkshop,
  setWorkshopAppointment,
  generateSeatCodeForMoto,
  type Result,
} from "@/lib/services/incidents";
import type { ActionState } from "@/components/backoffice/entity-dialog";

// --- Catàleg d'incidències ---

const catalogSchema = z.object({
  clientId: z.string().min(1, "Selecciona un client"),
  name: z.string().trim().min(1, "El nom és obligatori"),
  type: z.enum(["LEVE", "BLOCKING"]),
});

export async function createCatalogItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("incidents:write");
  const parsed = catalogSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.incidentCatalog.create({ data: parsed.data });
  revalidatePath("/backoffice/incidents");
  return { ok: true };
}

export async function updateCatalogItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("incidents:write");
  const id = String(formData.get("id") ?? "");
  const parsed = catalogSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.incidentCatalog.update({ where: { id }, data: parsed.data });
  revalidatePath("/backoffice/incidents");
  return { ok: true };
}

export async function toggleCatalogStatus(id: string, next: boolean) {
  await requirePermission("incidents:write");
  await db.incidentCatalog.update({
    where: { id },
    data: { status: next ? "ACTIVE" : "INACTIVE" },
  });
  revalidatePath("/backoffice/incidents");
}

// --- Tickets ---

export async function moveToWorkshopAction(ticketId: string) {
  await requirePermission("incidents:write");
  await moveTicketToWorkshop(ticketId);
  revalidatePath("/backoffice/incidents");
}

export async function closeTicketAction(ticketId: string) {
  await requirePermission("incidents:write");
  await closeTicket(ticketId);
  revalidatePath("/backoffice/incidents");
}

export async function setAppointmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("incidents:write");
  const ticketId = String(formData.get("ticketId") ?? "");
  const raw = String(formData.get("at") ?? "");
  const at = new Date(raw);
  if (!ticketId || isNaN(at.getTime())) return { error: "Data no vàlida." };
  await setWorkshopAppointment(ticketId, at);
  revalidatePath("/backoffice/incidents");
  return { ok: true };
}

// --- Codi de substitució ---

export async function generateSeatCodeAction(
  motoId: string
): Promise<Result & { code?: string }> {
  await requirePermission("incidents:write");
  const res = await generateSeatCodeForMoto(motoId);
  if (res.ok) revalidatePath("/backoffice/incidents");
  return res;
}

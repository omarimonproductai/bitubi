"use server";

import { db } from "@/lib/db";

export type QrState = { ok?: boolean; error?: string };

// Rate limiting bàsic en memòria (v1): 1 report per moto cada 60s.
const lastReport = new Map<string, number>();
const WINDOW_MS = 60_000;

export async function reportQrIncident(
  _prev: QrState,
  formData: FormData
): Promise<QrState> {
  const motoId = String(formData.get("motoId") ?? "");
  const catalogId = String(formData.get("catalogId") ?? "") || null;
  if (!motoId) return { error: "Vehicle no vàlid." };

  const moto = await db.moto.findUnique({ where: { id: motoId } });
  if (!moto) return { error: "Vehicle no trobat." };

  const now = Date.now();
  const last = lastReport.get(motoId) ?? 0;
  if (now - last < WINDOW_MS) {
    return { error: "Ja s'ha reportat una incidència fa poc. Torna-ho a provar més tard." };
  }
  lastReport.set(motoId, now);

  await db.ticket.create({
    data: { motoId, catalogId, status: "OPEN" },
  });
  return { ok: true };
}

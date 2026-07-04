"use client";

import { useActionState, useState } from "react";
import { reportQrIncident, type QrState } from "@/app/qr/[motoId]/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QrForm({
  motoId,
  catalog,
}: {
  motoId: string;
  catalog: { id: string; name: string }[];
}) {
  const [catalogId, setCatalogId] = useState("");
  const [state, formAction, pending] = useActionState<QrState, FormData>(
    reportQrIncident,
    {}
  );

  if (state.ok) {
    return (
      <div className="rounded-md bg-green-50 px-4 py-6 text-center text-sm text-green-700">
        Gràcies! La incidència s&apos;ha reportat. Operacions la revisarà.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="motoId" value={motoId} />
      {catalog.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Tipus d&apos;incidència</Label>
          <input type="hidden" name="catalogId" value={catalogId} />
          <Select value={catalogId} onValueChange={setCatalogId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona (opcional)…" />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviant…" : "Reportar incidència"}
      </Button>
    </form>
  );
}

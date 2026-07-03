"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { reportIncidentAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Result } from "@/lib/services/rider";

export function IncidentForm({
  catalog,
}: {
  catalog: { id: string; name: string; type: string }[];
}) {
  const [catalogId, setCatalogId] = useState("");
  const [state, formAction, pending] = useActionState<Result, FormData>(
    reportIncidentAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Incidència reportada");
      formRef.current?.reset();
      setCatalogId("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Tipus d&apos;incidència</Label>
        <input type="hidden" name="catalogId" value={catalogId} />
        <Select value={catalogId} onValueChange={setCatalogId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona…" />
          </SelectTrigger>
          <SelectContent>
            {catalog.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.type === "BLOCKING" ? " (bloquejant)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="photo">Fotografia (opcional)</Label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          className="text-sm"
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending || !catalogId}>
        {pending ? "Enviant…" : "Reportar"}
      </Button>
    </form>
  );
}

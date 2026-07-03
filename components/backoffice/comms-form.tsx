"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { sendCommsAction, type CommsState } from "@/app/backoffice/comms/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CommsForm({
  regions,
  clients,
}: {
  regions: { id: string; name: string }[];
  clients: { id: string; name: string }[];
}) {
  const [regionId, setRegionId] = useState("");
  const [clientId, setClientId] = useState("all");
  const [state, formAction, pending] = useActionState<CommsState, FormData>(
    sendCommsAction,
    {}
  );

  useEffect(() => {
    if (state.ok) toast.success(`Missatge enviat a ${state.sent} rider(s)`);
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Regió</Label>
        <input type="hidden" name="regionId" value={regionId} />
        <Select value={regionId} onValueChange={setRegionId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona regió…" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Client (opcional)</Label>
        <input
          type="hidden"
          name="clientId"
          value={clientId === "all" ? "" : clientId}
        />
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tots els clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Missatge</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Ex: Retireu les motos del carrer Major abans de les 15:00."
          required
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending || !regionId}>
        {pending ? "Enviant…" : "Enviar avís"}
      </Button>
    </form>
  );
}

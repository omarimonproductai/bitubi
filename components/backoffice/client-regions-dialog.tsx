"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { setClientRegions } from "@/app/backoffice/clients/actions";

export function ClientRegionsDialog({
  clientId,
  clientName,
  regions,
  selected,
}: {
  clientId: string;
  clientName: string;
  regions: { id: string; name: string }[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(selected));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    setError(undefined);
    startTransition(async () => {
      const res = await setClientRegions(clientId, Array.from(checked));
      if (res.error) {
        setError(res.error);
      } else {
        toast.success("Regions actualitzades");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Regions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regions de {clientName}</DialogTitle>
          <DialogDescription>
            Un client pot operar en una o més regions.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex flex-col gap-3">
          {regions.map((r) => (
            <label key={r.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={checked.has(r.id)}
                onChange={() => toggle(r.id)}
              />
              <Label className="cursor-pointer font-normal">{r.name}</Label>
            </label>
          ))}
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={pending}>
            {pending ? "Desant…" : "Desar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

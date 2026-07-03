"use client";

import { useActionState, useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignClientAction } from "@/app/backoffice/assignments/actions";
import type { Result } from "@/lib/services/assignments";

export function AssignClientDialog({
  motoId,
  plate,
  clients,
  currentClientId,
  currentSubstitution,
}: {
  motoId: string;
  plate: string;
  clients: { id: string; name: string }[];
  currentClientId?: string;
  currentSubstitution?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(currentClientId ?? "");
  const [state, formAction, pending] = useActionState<Result, FormData>(
    assignClientAction,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Moto assignada al client");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {currentClientId ? "Canviar client" : "Assignar client"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Assignar {plate} a un client</DialogTitle>
            <DialogDescription>
              Només clients que operen en la regió de la moto.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex flex-col gap-4">
            <input type="hidden" name="motoId" value={motoId} />
            <div className="flex flex-col gap-2">
              <Label>Client</Label>
              <input type="hidden" name="clientId" value={clientId} />
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 && (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      Cap client opera en aquesta regió
                    </div>
                  )}
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isSubstitution"
                defaultChecked={currentSubstitution}
                className="size-4 accent-primary"
              />
              <span className="text-sm">
                És moto de <strong>substitució</strong> per aquest client i regió
              </span>
            </label>
            {state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !clientId}>
              {pending ? "Desant…" : "Desar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

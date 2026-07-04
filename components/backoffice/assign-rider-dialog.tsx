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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRiderAction } from "@/app/backoffice/assignments/actions";
import type { Result } from "@/lib/services/assignments";

export function AssignRiderDialog({
  motoId,
  plate,
  riders,
}: {
  motoId: string;
  plate: string;
  riders: { id: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [riderId, setRiderId] = useState("");
  const [state, formAction, pending] = useActionState<Result, FormData>(
    assignRiderAction,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Recepció programada per al rider");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Assignar a rider
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Assignar {plate} a un rider</DialogTitle>
            <DialogDescription>
              Riders del mateix client i regió que la moto. Es crearà la
              recepció del vehicle.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex flex-col gap-4">
            <input type="hidden" name="motoId" value={motoId} />
            <div className="flex flex-col gap-2">
              <Label>Rider</Label>
              <input type="hidden" name="riderId" value={riderId} />
              <Select value={riderId} onValueChange={setRiderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rider…" />
                </SelectTrigger>
                <SelectContent>
                  {riders.length === 0 && (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      Cap rider elegible
                    </div>
                  )}
                  {riders.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="receptionAt">Dia i hora de recepció</Label>
              <Input
                id="receptionAt"
                name="receptionAt"
                type="datetime-local"
                required
              />
            </div>
            {state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !riderId}>
              {pending ? "Desant…" : "Programar recepció"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import type { RiderActionState } from "@/app/backoffice/riders/actions";

type Action = (
  prev: RiderActionState,
  formData: FormData
) => Promise<RiderActionState>;

export function RiderDialog({
  mode,
  rider,
  clients,
  regions,
  clientRegions,
  action,
}: {
  mode: "create" | "edit";
  rider?: { id: string; email: string; clientId: string; regionId: string };
  clients: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  clientRegions: Record<string, string[]>;
  action: Action;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(rider?.clientId ?? "");
  const [regionId, setRegionId] = useState(rider?.regionId ?? "");
  const [state, formAction, pending] = useActionState<RiderActionState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if (state.ok && !state.password) {
      setOpen(false);
      toast.success("Rider desat");
    }
  }, [state]);

  const allowedRegions = regions.filter((r) =>
    (clientRegions[clientId] ?? []).includes(r.id)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setClientId(rider?.clientId ?? "");
          setRegionId(rider?.regionId ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "ghost"} size="sm">
          {mode === "create" ? "Nou rider" : "Editar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {state.password ? (
          <PasswordReveal
            email={state.email!}
            password={state.password}
            onClose={() => setOpen(false)}
          />
        ) : (
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Nou rider" : "Editar rider"}
              </DialogTitle>
              <DialogDescription>
                L&apos;email no es verifica. El password el genera el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex flex-col gap-4">
              {rider && <input type="hidden" name="id" value={rider.id} />}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={rider?.email}
                  placeholder="1318907@mail.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Client</Label>
                <input type="hidden" name="clientId" value={clientId} />
                <Select
                  value={clientId}
                  onValueChange={(v) => {
                    setClientId(v);
                    setRegionId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Regió</Label>
                <input type="hidden" name="regionId" value={regionId} />
                <Select
                  value={regionId}
                  onValueChange={setRegionId}
                  disabled={!clientId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clientId
                          ? "Selecciona regió…"
                          : "Tria un client primer"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRegions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.error && (
                <p className="text-destructive text-sm">{state.error}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Desant…" : "Desar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PasswordReveal({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Rider creat</DialogTitle>
        <DialogDescription>
          Guarda aquest password: no es tornarà a mostrar.
        </DialogDescription>
      </DialogHeader>
      <div className="my-4 flex flex-col gap-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Email: </span>
          <span className="font-medium">{email}</span>
        </div>
        <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2">
          <code className="text-lg font-semibold tracking-wider">
            {password}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(password);
              toast.success("Password copiat");
            }}
          >
            Copiar
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Fet</Button>
      </DialogFooter>
    </>
  );
}

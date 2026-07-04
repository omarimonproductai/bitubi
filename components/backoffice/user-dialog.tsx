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
import type { UserActionState } from "@/app/backoffice/users/actions";

const ROLES = [
  { value: "ADMIN", label: "Admin Cooltra" },
  { value: "REGION_MANAGER", label: "Responsable de regió" },
  { value: "RIDER_MANAGER", label: "Gestor de riders" },
];

type Action = (
  prev: UserActionState,
  formData: FormData
) => Promise<UserActionState>;

export function UserDialog({
  mode,
  user,
  regions,
  action,
}: {
  mode: "create" | "edit";
  user?: { id: string; email: string; role: string; regionId: string | null };
  regions: { id: string; name: string }[];
  action: Action;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user?.role ?? "");
  const [regionId, setRegionId] = useState(user?.regionId ?? "");
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if (state.ok && !state.password) {
      setOpen(false);
      toast.success("Usuari desat");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "ghost"} size="sm">
          {mode === "create" ? "Nou usuari" : "Editar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {state.password ? (
          <>
            <DialogHeader>
              <DialogTitle>Usuari creat</DialogTitle>
              <DialogDescription>
                Guarda aquest password: no es tornarà a mostrar.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex flex-col gap-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Email: </span>
                <span className="font-medium">{state.email}</span>
              </div>
              <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2">
                <code className="text-lg font-semibold tracking-wider">
                  {state.password}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(state.password!);
                    toast.success("Password copiat");
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Fet</Button>
            </DialogFooter>
          </>
        ) : (
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Nou usuari" : "Editar usuari"}
              </DialogTitle>
              <DialogDescription>
                El password el genera el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex flex-col gap-4">
              {user && <input type="hidden" name="id" value={user.id} />}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email}
                  placeholder="responsable@cooltra.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Rol</Label>
                <input type="hidden" name="role" value={role} />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona rol…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role === "REGION_MANAGER" && (
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
              )}
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

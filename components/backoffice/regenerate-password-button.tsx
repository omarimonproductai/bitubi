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
} from "@/components/ui/dialog";
import { regeneratePassword } from "@/app/backoffice/riders/actions";

export function RegeneratePasswordButton({ riderId }: { riderId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await regeneratePassword(riderId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.password) {
        setPassword(res.password);
        setOpen(true);
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={run} disabled={pending}>
        {pending ? "…" : "Password"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nou password</DialogTitle>
            <DialogDescription>
              Guarda aquest password: no es tornarà a mostrar.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted my-4 flex items-center justify-between rounded-md px-3 py-2">
            <code className="text-lg font-semibold tracking-wider">
              {password}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (password) navigator.clipboard?.writeText(password);
                toast.success("Password copiat");
              }}
            >
              Copiar
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Fet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import { generateSeatCodeAction } from "@/app/backoffice/incidents/actions";

export function SeatCodeButton({
  motoId,
  currentCode,
}: {
  motoId: string;
  currentCode?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await generateSeatCodeAction(motoId);
      if (res.error) toast.error(res.error);
      else if (res.code) {
        setCode(res.code);
        setOpen(true);
      }
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={run} disabled={pending}>
        {pending ? "…" : currentCode ? "Regenerar codi" : "Generar codi"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Codi d&apos;obrir seient</DialogTitle>
            <DialogDescription>
              Aquest codi de 5 dígits l&apos;introduirà el rider a l&apos;app.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted my-4 flex items-center justify-center rounded-md py-4">
            <code className="text-3xl font-bold tracking-[0.4em]">{code}</code>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Fet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

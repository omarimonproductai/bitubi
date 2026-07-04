"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { openSeatAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Result } from "@/lib/services/rider";

export function OpenSeatForm() {
  const [state, formAction, pending] = useActionState<Result, FormData>(
    openSeatAction,
    {}
  );

  useEffect(() => {
    if (state.ok) toast.success("Seient obert! Ja pots agafar el casc.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="code">
        Codi d&apos;obrir seient (5 dígits)
      </label>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        pattern="\d{5}"
        maxLength={5}
        placeholder="•••••"
        className="text-center text-2xl tracking-[0.5em]"
        required
      />
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.ok && (
        <p className="text-sm font-medium text-green-600">Seient obert ✓</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviant…" : "Enviar"}
      </Button>
    </form>
  );
}

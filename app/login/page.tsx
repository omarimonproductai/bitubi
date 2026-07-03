"use client";

import { useActionState } from "react";
import { loginBackoffice, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginBackoffice,
    {}
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="text-xl">KOMOBI HD Fleet</CardTitle>
            <CardDescription>Accés al backoffice de Cooltra</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@cooltra.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrasenya</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Entrant…" : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

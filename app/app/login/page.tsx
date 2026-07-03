"use client";

import { useActionState } from "react";
import { loginRider, type LoginState } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RiderLoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginRider,
    {}
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <form action={formAction}>
          <CardHeader>
            <CardTitle className="text-xl">KOMOBI · App del rider</CardTitle>
            <CardDescription>Entra amb el teu email i password</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="1318907@mail.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
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
            <Button type="submit" className="mt-2 w-full" disabled={pending}>
              {pending ? "Entrant…" : "Entrar"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

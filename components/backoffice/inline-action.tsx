"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function SubmitButton({
  children,
  variant = "ghost",
  size = "sm",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? "…" : children}
    </Button>
  );
}

export function InlineAction({
  action,
  children,
  variant,
  size,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "icon";
}) {
  return (
    <form action={action}>
      <SubmitButton variant={variant} size={size}>
        {children}
      </SubmitButton>
    </form>
  );
}

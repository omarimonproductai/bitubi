"use client";

import * as React from "react";
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

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "select";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
};

export type ActionState = { ok?: boolean; error?: string };

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function EntityDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "default",
  action,
  fields,
  hidden,
  submitLabel = "Desar",
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  action: Action;
  fields: FieldConfig[];
  hidden?: Record<string, string>;
  submitLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Canvis desats");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="my-4 flex flex-col gap-4">
            {hidden &&
              Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            {fields.map((f) => (
              <Field key={f.name} field={f} />
            ))}
            {state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Desant…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ field }: { field: FieldConfig }) {
  const [value, setValue] = useState(field.defaultValue ?? "");

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={field.name}>{field.label}</Label>
        <input type="hidden" name={field.name} value={value} />
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger id={field.name}>
            <SelectValue placeholder={field.placeholder ?? "Selecciona…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name}>{field.label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type={field.type ?? "text"}
        placeholder={field.placeholder}
        required={field.required}
        defaultValue={field.defaultValue}
      />
    </div>
  );
}

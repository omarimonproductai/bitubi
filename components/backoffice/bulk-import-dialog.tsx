"use client";

import { useActionState } from "react";
import { importRiders, type ImportState } from "@/app/backoffice/riders/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function BulkImportDialog() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importRiders,
    {}
  );

  const created = state.rows?.filter((r) => r.ok) ?? [];
  const failed = state.rows?.filter((r) => !r.ok) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Import massiu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Alta massiva de riders</DialogTitle>
            <DialogDescription>
              Una línia per rider: <code>email,client,regió</code>. El password
              es genera automàticament.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex flex-col gap-3">
            <Label htmlFor="csv">CSV</Label>
            <Textarea
              id="csv"
              name="csv"
              rows={6}
              className="font-mono text-xs"
              placeholder={"nou1@mail.com,JETA,Barcelona\nnou2@mail.com,Glovo,Sevilla"}
            />
            {state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}
          </div>

          {state.rows && (
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <Badge variant="default">{created.length} creats</Badge>
                {failed.length > 0 && (
                  <Badge variant="destructive">{failed.length} errors</Badge>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border text-xs">
                {state.rows.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b px-2 py-1 last:border-0"
                  >
                    <span>{r.email}</span>
                    {r.ok ? (
                      <code className="font-semibold">{r.password}</code>
                    ) : (
                      <span className="text-destructive">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Important…" : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

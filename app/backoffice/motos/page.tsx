import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog, type FieldConfig } from "@/components/backoffice/entity-dialog";
import { InlineAction } from "@/components/backoffice/inline-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createMoto, updateMoto, toggleMotoStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function MotosPage() {
  await requirePermission("motos:write");

  const [motos, regions] = await Promise.all([
    db.moto.findMany({
      include: {
        region: true,
        riderAssignments: {
          where: { status: "LINKED" },
          include: { rider: true },
        },
      },
      orderBy: { plate: "asc" },
    }),
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const regionOptions = regions.map((r) => ({ value: r.id, label: r.name }));

  const fields = (m?: (typeof motos)[number]): FieldConfig[] => [
    { name: "plate", label: "Matrícula", required: true, defaultValue: m?.plate, placeholder: "Ex: 1234MNM" },
    { name: "regionId", label: "Regió", type: "select", options: regionOptions, defaultValue: m?.regionId, required: true },
  ];

  return (
    <>
      <PageHeader
        title="Motos"
        description="Cada moto pertany a una sola regió. Una moto amb rider vinculat no es pot moure de regió."
      >
        <EntityDialog
          title="Nova moto"
          triggerLabel="Nova moto"
          action={createMoto}
          fields={fields()}
        />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead>Rider vinculat</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    Encara no hi ha motos.
                  </TableCell>
                </TableRow>
              )}
              {motos.map((m) => {
                const active = m.status === "ACTIVE";
                const linked = m.riderAssignments[0]?.rider;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-medium">{m.plate}</TableCell>
                    <TableCell>{m.region.name}</TableCell>
                    <TableCell>
                      {linked ? (
                        <Badge variant="outline">{linked.email}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Activa" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EntityDialog
                          title="Editar moto"
                          triggerLabel="Editar"
                          triggerVariant="ghost"
                          action={updateMoto}
                          hidden={{ id: m.id }}
                          fields={fields(m)}
                        />
                        <InlineAction action={toggleMotoStatus.bind(null, m.id, !active)}>
                          {active ? "Donar de baixa" : "Reactivar"}
                        </InlineAction>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

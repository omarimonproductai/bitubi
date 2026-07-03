import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog } from "@/components/backoffice/entity-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateKmAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  await requirePermission("maintenance:write");

  const motos = await db.moto.findMany({
    where: { status: "ACTIVE" },
    include: { region: true, maintenance: true },
    orderBy: { plate: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Mantenim ents dinàmics"
        description="Registra els km reals després d'una intervenció; el proper manteniment es recalcula (km + 10.000)."
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead className="text-right">Km actuals</TableHead>
                <TableHead className="text-right">Proper manteniment</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motos.map((m) => {
                const due =
                  m.maintenance &&
                  m.maintenance.currentKm >= m.maintenance.nextMaintenanceKm;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-medium">{m.plate}</TableCell>
                    <TableCell>{m.region.name}</TableCell>
                    <TableCell className="text-right">
                      {m.maintenance ? m.maintenance.currentKm.toLocaleString("ca-ES") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.maintenance ? (
                        <span className="flex items-center justify-end gap-2">
                          {m.maintenance.nextMaintenanceKm.toLocaleString("ca-ES")}
                          {due && <Badge variant="destructive">Toca</Badge>}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <EntityDialog
                        title={`Actualitzar km · ${m.plate}`}
                        description="Km reals després de la intervenció."
                        triggerLabel="Actualitzar km"
                        triggerVariant="ghost"
                        action={updateKmAction}
                        hidden={{ motoId: m.id }}
                        fields={[
                          {
                            name: "currentKm",
                            label: "Km actuals",
                            type: "number",
                            required: true,
                            defaultValue: m.maintenance?.currentKm?.toString(),
                          },
                        ]}
                      />
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

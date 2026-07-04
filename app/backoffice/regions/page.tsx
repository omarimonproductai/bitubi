import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog } from "@/components/backoffice/entity-dialog";
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
import { createRegion, updateRegion, toggleRegionStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  await requirePermission("regions:write");

  const regions = await db.region.findMany({
    include: { _count: { select: { motos: true, addresses: true, riders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader title="Regions" description="Alta i baixa de regions operatives">
        <EntityDialog
          title="Nova regió"
          triggerLabel="Nova regió"
          action={createRegion}
          fields={[{ name: "name", label: "Nom", required: true, placeholder: "Ex: Barcelona" }]}
        />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Motos</TableHead>
                <TableHead className="text-right">Adreces</TableHead>
                <TableHead className="text-right">Riders</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    Encara no hi ha regions.
                  </TableCell>
                </TableRow>
              )}
              {regions.map((r) => {
                const active = r.status === "ACTIVE";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Activa" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{r._count.motos}</TableCell>
                    <TableCell className="text-right">{r._count.addresses}</TableCell>
                    <TableCell className="text-right">{r._count.riders}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EntityDialog
                          title="Editar regió"
                          triggerLabel="Editar"
                          triggerVariant="ghost"
                          action={updateRegion}
                          hidden={{ id: r.id }}
                          fields={[
                            { name: "name", label: "Nom", required: true, defaultValue: r.name },
                          ]}
                        />
                        <InlineAction
                          action={toggleRegionStatus.bind(null, r.id, !active)}
                        >
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

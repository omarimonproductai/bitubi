import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog } from "@/components/backoffice/entity-dialog";
import { InlineAction } from "@/components/backoffice/inline-action";
import { ClientRegionsDialog } from "@/components/backoffice/client-regions-dialog";
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
import { createClient, updateClient, toggleClientStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requirePermission("clients:write");

  const [clients, regions] = await Promise.all([
    db.client.findMany({
      include: {
        regionClients: { include: { region: true } },
        _count: { select: { riders: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Clients" description="Clients B2B i les regions on operen">
        <EntityDialog
          title="Nou client"
          triggerLabel="Nou client"
          action={createClient}
          fields={[{ name: "name", label: "Nom", required: true, placeholder: "Ex: JETA" }]}
        />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead className="text-right">Riders</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    Encara no hi ha clients.
                  </TableCell>
                </TableRow>
              )}
              {clients.map((c) => {
                const active = c.status === "ACTIVE";
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.regionClients.length === 0 && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        {c.regionClients.map((rc) => (
                          <Badge key={rc.id} variant="outline">
                            {rc.region.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{c._count.riders}</TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Actiu" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ClientRegionsDialog
                          clientId={c.id}
                          clientName={c.name}
                          regions={regions.map((r) => ({ id: r.id, name: r.name }))}
                          selected={c.regionClients.map((rc) => rc.regionId)}
                        />
                        <EntityDialog
                          title="Editar client"
                          triggerLabel="Editar"
                          triggerVariant="ghost"
                          action={updateClient}
                          hidden={{ id: c.id }}
                          fields={[{ name: "name", label: "Nom", required: true, defaultValue: c.name }]}
                        />
                        <InlineAction action={toggleClientStatus.bind(null, c.id, !active)}>
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

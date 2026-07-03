import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { RiderDialog } from "@/components/backoffice/rider-dialog";
import { RegeneratePasswordButton } from "@/components/backoffice/regenerate-password-button";
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
import { createRider, updateRider, toggleRiderStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function RidersPage() {
  await requirePermission("riders:write");

  const [riders, clients, regions] = await Promise.all([
    db.rider.findMany({
      include: { client: true, region: true },
      orderBy: { email: "asc" },
    }),
    db.client.findMany({
      where: { status: "ACTIVE" },
      include: { regionClients: true },
      orderBy: { name: "asc" },
    }),
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const clientRegions: Record<string, string[]> = {};
  for (const c of clients) {
    clientRegions[c.id] = c.regionClients.map((rc) => rc.regionId);
  }
  const clientOpts = clients.map((c) => ({ id: c.id, name: c.name }));
  const regionOpts = regions.map((r) => ({ id: r.id, name: r.name }));

  return (
    <>
      <PageHeader
        title="Riders"
        description="Cada rider pertany a un client i una regió. Email no verificable."
      >
        <RiderDialog
          mode="create"
          clients={clientOpts}
          regions={regionOpts}
          clientRegions={clientRegions}
          action={createRider}
        />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    Encara no hi ha riders.
                  </TableCell>
                </TableRow>
              )}
              {riders.map((r) => {
                const active = r.status === "ACTIVE";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.email}</TableCell>
                    <TableCell>{r.client.name}</TableCell>
                    <TableCell>{r.region.name}</TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Actiu" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <RegeneratePasswordButton riderId={r.id} />
                        <RiderDialog
                          mode="edit"
                          rider={{
                            id: r.id,
                            email: r.email,
                            clientId: r.clientId,
                            regionId: r.regionId,
                          }}
                          clients={clientOpts}
                          regions={regionOpts}
                          clientRegions={clientRegions}
                          action={updateRider}
                        />
                        <InlineAction action={toggleRiderStatus.bind(null, r.id, !active)}>
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

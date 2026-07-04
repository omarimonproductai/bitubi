import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { AssignClientDialog } from "@/components/backoffice/assign-client-dialog";
import { AssignRiderDialog } from "@/components/backoffice/assign-rider-dialog";
import { InlineAction } from "@/components/backoffice/inline-action";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { linkAction, unlinkAction, unassignClientAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  RECEPTION: { label: "Recepció", variant: "outline" },
  LINKED: { label: "Vinculada", variant: "default" },
  UNLINKED: { label: "Desvinculada", variant: "secondary" },
};

export default async function AssignmentsPage() {
  await requirePermission("assignments:write");

  const [motos, regionClients, ridersActive, activeAssignments] =
    await Promise.all([
      db.moto.findMany({
        where: { status: "ACTIVE" },
        include: {
          region: true,
          clientAssignments: { include: { client: true } },
          riderAssignments: {
            where: { status: { in: ["RECEPTION", "LINKED"] } },
            include: { rider: true },
          },
        },
        orderBy: { plate: "asc" },
      }),
      db.regionClient.findMany({ include: { client: true } }),
      db.rider.findMany({ where: { status: "ACTIVE" } }),
      db.motoRiderAssignment.findMany({
        where: { status: { in: ["RECEPTION", "LINKED"] } },
        include: { moto: true, rider: true },
        orderBy: { receptionAt: "asc" },
      }),
    ]);

  // Clients que operen per regió (només actius).
  const clientsByRegion = new Map<string, { id: string; name: string }[]>();
  for (const rc of regionClients) {
    if (rc.client.status !== "ACTIVE") continue;
    const list = clientsByRegion.get(rc.regionId) ?? [];
    list.push({ id: rc.client.id, name: rc.client.name });
    clientsByRegion.set(rc.regionId, list);
  }

  const busyRiderIds = new Set(activeAssignments.map((a) => a.riderId));

  function eligibleRiders(clientId: string, regionId: string) {
    return ridersActive
      .filter(
        (r) =>
          r.clientId === clientId &&
          r.regionId === regionId &&
          !busyRiderIds.has(r.id)
      )
      .map((r) => ({ id: r.id, email: r.email }));
  }

  return (
    <>
      <PageHeader
        title="Assignacions"
        description="Assigna motos a clients i, després, a riders (recepció → vincular → desvincular)."
      />

      <Tabs defaultValue="client">
        <TabsList>
          <TabsTrigger value="client">Motos → Client</TabsTrigger>
          <TabsTrigger value="rider">Motos → Rider</TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Regió</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Substitució</TableHead>
                    <TableHead className="text-right">Accions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motos.map((m) => {
                    const ca = m.clientAssignments[0];
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono font-medium">{m.plate}</TableCell>
                        <TableCell>{m.region.name}</TableCell>
                        <TableCell>
                          {ca ? ca.client.name : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {ca?.isSubstitution ? (
                            <Badge variant="outline">Substitució</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <AssignClientDialog
                              motoId={m.id}
                              plate={m.plate}
                              clients={clientsByRegion.get(m.regionId) ?? []}
                              currentClientId={ca?.clientId}
                              currentSubstitution={ca?.isSubstitution}
                            />
                            {ca && (
                              <InlineAction action={unassignClientAction.bind(null, m.id)}>
                                Treure
                              </InlineAction>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rider">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Assignar recepció</h2>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Regió</TableHead>
                        <TableHead className="text-right">Acció</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {motos
                        .filter((m) => {
                          const ca = m.clientAssignments[0];
                          return (
                            ca &&
                            !ca.isSubstitution &&
                            m.riderAssignments.length === 0
                          );
                        })
                        .map((m) => {
                          const ca = m.clientAssignments[0];
                          return (
                            <TableRow key={m.id}>
                              <TableCell className="font-mono font-medium">{m.plate}</TableCell>
                              <TableCell>{ca.client.name}</TableCell>
                              <TableCell>{m.region.name}</TableCell>
                              <TableCell className="text-right">
                                <AssignRiderDialog
                                  motoId={m.id}
                                  plate={m.plate}
                                  riders={eligibleRiders(ca.clientId, m.regionId)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold">Assignacions actives</h2>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Rider</TableHead>
                        <TableHead>Recepció</TableHead>
                        <TableHead>Estat</TableHead>
                        <TableHead className="text-right">Accions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAssignments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                            Cap assignació activa.
                          </TableCell>
                        </TableRow>
                      )}
                      {activeAssignments.map((a) => {
                        const badge = STATUS_BADGE[a.status];
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono font-medium">{a.moto.plate}</TableCell>
                            <TableCell>{a.rider.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.receptionAt.toLocaleString("ca-ES")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                {a.status === "RECEPTION" && (
                                  <InlineAction
                                    action={linkAction.bind(null, a.id)}
                                    variant="default"
                                  >
                                    Vincular
                                  </InlineAction>
                                )}
                                <InlineAction
                                  action={unlinkAction.bind(null, a.id)}
                                  variant="destructive"
                                >
                                  Desvincular
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
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

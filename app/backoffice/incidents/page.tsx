import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog, type FieldConfig } from "@/components/backoffice/entity-dialog";
import { InlineAction } from "@/components/backoffice/inline-action";
import { SeatCodeButton } from "@/components/backoffice/seat-code-button";
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
import {
  createCatalogItem,
  updateCatalogItem,
  toggleCatalogStatus,
  moveToWorkshopAction,
  closeTicketAction,
  setAppointmentAction,
} from "./actions";

export const dynamic = "force-dynamic";

const TICKET_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  OPEN: { label: "Obert", variant: "outline" },
  IN_WORKSHOP: { label: "En taller", variant: "secondary" },
  CLOSED: { label: "Tancat", variant: "default" },
};

export default async function IncidentsPage() {
  await requirePermission("incidents:write");

  const [catalog, clients, tickets, substitutions] = await Promise.all([
    db.incidentCatalog.findMany({
      include: { client: true },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
    }),
    db.client.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.ticket.findMany({
      include: { moto: true, rider: true, catalog: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.motoClientAssignment.findMany({
      where: { isSubstitution: true },
      include: { moto: true, client: true },
      orderBy: { moto: { plate: "asc" } },
    }),
  ]);

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const typeOptions = [
    { value: "LEVE", label: "Lleu" },
    { value: "BLOCKING", label: "Bloquejant" },
  ];

  const catalogFields = (c?: (typeof catalog)[number]): FieldConfig[] => [
    { name: "clientId", label: "Client", type: "select", options: clientOptions, defaultValue: c?.clientId, required: true },
    { name: "name", label: "Nom de la incidència", defaultValue: c?.name, required: true },
    { name: "type", label: "Tipus", type: "select", options: typeOptions, defaultValue: c?.type, required: true },
  ];

  return (
    <>
      <PageHeader
        title="Incidències"
        description="Catàleg per client, gestió de tickets i codis de substitució."
      />

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catàleg</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="subs">Substitució</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <div className="mb-3 flex justify-end">
            <EntityDialog
              title="Nova incidència"
              triggerLabel="Nova incidència"
              action={createCatalogItem}
              fields={catalogFields()}
            />
          </div>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Incidència</TableHead>
                    <TableHead>Tipus</TableHead>
                    <TableHead>Estat</TableHead>
                    <TableHead className="text-right">Accions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.map((c) => {
                    const active = c.status === "ACTIVE";
                    return (
                      <TableRow key={c.id}>
                        <TableCell>{c.client.name}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant={c.type === "BLOCKING" ? "destructive" : "secondary"}>
                            {c.type === "BLOCKING" ? "Bloquejant" : "Lleu"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={active ? "default" : "secondary"}>
                            {active ? "Actiu" : "Baixa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <EntityDialog
                              title="Editar incidència"
                              triggerLabel="Editar"
                              triggerVariant="ghost"
                              action={updateCatalogItem}
                              hidden={{ id: c.id }}
                              fields={catalogFields(c)}
                            />
                            <InlineAction action={toggleCatalogStatus.bind(null, c.id, !active)}>
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
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Incidència</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Cita taller</TableHead>
                    <TableHead>Estat</TableHead>
                    <TableHead className="text-right">Accions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        Cap ticket.
                      </TableCell>
                    </TableRow>
                  )}
                  {tickets.map((t) => {
                    const badge = TICKET_BADGE[t.status];
                    const closed = t.status === "CLOSED";
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono font-medium">{t.moto.plate}</TableCell>
                        <TableCell>
                          {t.catalog ? (
                            <span className="flex items-center gap-2">
                              {t.catalog.name}
                              {t.catalog.type === "BLOCKING" && (
                                <Badge variant="destructive">Bloquejant</Badge>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{t.rider?.email ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.workshopAppointmentAt
                            ? t.workshopAppointmentAt.toLocaleString("ca-ES")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {!closed && (
                            <div className="flex items-center justify-end gap-1">
                              <EntityDialog
                                title="Cita de taller"
                                triggerLabel="Cita"
                                triggerVariant="ghost"
                                action={setAppointmentAction}
                                hidden={{ ticketId: t.id }}
                                fields={[{ name: "at", label: "Dia i hora", type: "datetime-local", required: true }]}
                              />
                              {t.status === "OPEN" && (
                                <InlineAction action={moveToWorkshopAction.bind(null, t.id)}>
                                  A taller
                                </InlineAction>
                              )}
                              <InlineAction
                                action={closeTicketAction.bind(null, t.id)}
                                variant="default"
                              >
                                Tancar
                              </InlineAction>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subs">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Codi actual</TableHead>
                    <TableHead className="text-right">Accions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {substitutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                        Cap moto de substitució.
                      </TableCell>
                    </TableRow>
                  )}
                  {substitutions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">{s.moto.plate}</TableCell>
                      <TableCell>{s.client.name}</TableCell>
                      <TableCell>
                        {s.seatCode ? (
                          <code className="tracking-widest">{s.seatCode}</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <SeatCodeButton motoId={s.motoId} currentCode={s.seatCode} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

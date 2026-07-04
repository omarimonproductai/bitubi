import { requireRider } from "@/lib/guards";
import { db } from "@/lib/db";
import { getActiveAssignment } from "@/lib/services/rider";
import { IncidentForm } from "@/components/rider/incident-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

const TICKET_LABEL: Record<string, string> = {
  OPEN: "Obert",
  IN_WORKSHOP: "En taller",
  CLOSED: "Tancat",
};

export default async function IncidentPage() {
  const rider = await requireRider();
  const assignment = await getActiveAssignment(rider.id);

  const [catalog, myTickets] = await Promise.all([
    db.incidentCatalog.findMany({
      where: { clientId: rider.clientId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    db.ticket.findMany({
      where: { riderId: rider.id },
      include: { moto: true, catalog: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Reportar incidència</CardTitle>
          <CardDescription>
            {assignment
              ? `Vehicle ${assignment.moto.plate}`
              : "Necessites un vehicle assignat per reportar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignment ? (
            <IncidentForm
              catalog={catalog.map((c) => ({ id: c.id, name: c.name, type: c.type }))}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No tens cap vehicle actiu.
            </p>
          )}
        </CardContent>
      </Card>

      {myTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Les meves incidències</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {myTickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-mono font-medium">{t.moto.plate}</span>
                  <span className="text-muted-foreground ml-2">
                    {t.catalog?.name}
                  </span>
                </div>
                <Badge variant={t.status === "CLOSED" ? "default" : "outline"}>
                  {TICKET_LABEL[t.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

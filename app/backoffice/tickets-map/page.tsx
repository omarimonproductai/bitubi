import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TicketsMapPage() {
  await requirePermission("incidents:write");

  const openTickets = await db.ticket.findMany({
    where: { status: { not: "CLOSED" } },
    include: { moto: { include: { region: true } }, catalog: true },
  });

  // Agrupació per regió (zona). Sense telemàtica de vehicle, la geolocalització
  // fina no és possible; s'agrupa per la regió de la moto.
  const byRegion = new Map<
    string,
    { region: string; tickets: typeof openTickets }
  >();
  for (const t of openTickets) {
    const key = t.moto.regionId;
    const entry = byRegion.get(key) ?? { region: t.moto.region.name, tickets: [] };
    entry.tickets.push(t);
    byRegion.set(key, entry);
  }
  const zones = Array.from(byRegion.values()).sort(
    (a, b) => b.tickets.length - a.tickets.length
  );

  return (
    <>
      <PageHeader
        title="Mapa de tickets"
        description="Incidències obertes agrupades per zona per prioritzar intervencions."
      />

      {zones.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center">
            No hi ha incidències obertes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((z) => (
            <Card key={z.region}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{z.region}</CardTitle>
                  <Badge variant={z.tickets.length >= 5 ? "destructive" : "secondary"}>
                    {z.tickets.length} obert{z.tickets.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <CardDescription>
                  <a
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/${encodeURIComponent(z.region)}`}
                  >
                    Obrir a Google Maps
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {z.tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-mono font-medium">{t.moto.plate}</span>
                    <span className="text-muted-foreground truncate">
                      {t.catalog?.name ?? "—"}
                    </span>
                    {t.catalog?.type === "BLOCKING" && (
                      <Badge variant="destructive">Bloq.</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

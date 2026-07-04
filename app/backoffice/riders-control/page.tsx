import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
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

export const dynamic = "force-dynamic";

export default async function RidersControlPage() {
  await requirePermission("control:read");

  const riders = await db.rider.findMany({
    where: { status: "ACTIVE" },
    include: {
      client: true,
      region: true,
      _count: { select: { tickets: true } },
      assignments: {
        where: { status: { in: ["RECEPTION", "LINKED"] } },
        include: { moto: true },
      },
    },
    orderBy: [{ region: { name: "asc" } }, { email: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Control de riders"
        description="Estat operatiu per rider. Mètriques de productivitat/rutes (km, franges) pendents de definir amb JETA."
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead>Vehicle actual</TableHead>
                <TableHead className="text-right">Incidències</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((r) => {
                const current = r.assignments[0];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.email}</TableCell>
                    <TableCell>{r.client.name}</TableCell>
                    <TableCell>{r.region.name}</TableCell>
                    <TableCell>
                      {current ? (
                        <span className="flex items-center gap-2">
                          <span className="font-mono">{current.moto.plate}</span>
                          <Badge variant={current.status === "LINKED" ? "default" : "outline"}>
                            {current.status === "LINKED" ? "Vinculat" : "Recepció"}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sense vehicle</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r._count.tickets}</TableCell>
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

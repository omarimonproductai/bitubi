import { db } from "@/lib/db";
import { requireBackofficeUser } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BackofficeDashboard() {
  await requireBackofficeUser();

  const [regions, addresses, motos, clients, riders, openTickets] =
    await Promise.all([
      db.region.count({ where: { status: "ACTIVE" } }),
      db.address.count({ where: { status: "ACTIVE" } }),
      db.moto.count({ where: { status: "ACTIVE" } }),
      db.client.count({ where: { status: "ACTIVE" } }),
      db.rider.count({ where: { status: "ACTIVE" } }),
      db.ticket.count({ where: { status: { not: "CLOSED" } } }),
    ]);

  const stats = [
    { label: "Regions actives", value: regions },
    { label: "Adreces", value: addresses },
    { label: "Motos", value: motos },
    { label: "Clients", value: clients },
    { label: "Riders", value: riders },
    { label: "Tickets oberts", value: openTickets },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resum de l'estat de la flota"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  );
}

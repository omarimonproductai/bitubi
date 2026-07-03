import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { CommsForm } from "@/components/backoffice/comms-form";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CommsPage() {
  await requirePermission("comms:write");

  const [regions, clients] = await Promise.all([
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.client.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Comunicació directa"
        description="Envia un avís als riders d'una zona. Canal v1: notificació in-app (push web)."
      />
      <Card>
        <CardContent className="py-6">
          <CommsForm
            regions={regions.map((r) => ({ id: r.id, name: r.name }))}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </>
  );
}

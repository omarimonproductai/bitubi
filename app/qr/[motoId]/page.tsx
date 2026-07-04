import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { QrForm } from "@/components/rider/qr-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function QrReportPage({
  params,
}: {
  params: Promise<{ motoId: string }>;
}) {
  const { motoId } = await params;

  const moto = await db.moto.findUnique({
    where: { id: motoId },
    include: { clientAssignments: true },
  });
  if (!moto) notFound();

  const clientId = moto.clientAssignments[0]?.clientId;
  const catalog = clientId
    ? await db.incidentCatalog.findMany({
        where: { clientId, status: "ACTIVE" },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <Card>
        <CardHeader>
          <CardTitle>Reportar una incidència</CardTitle>
          <CardDescription>
            Vehicle <span className="font-mono font-medium">{moto.plate}</span>.
            No cal cap compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrForm
            motoId={moto.id}
            catalog={catalog.map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

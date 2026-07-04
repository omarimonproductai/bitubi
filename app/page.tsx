import Link from "next/link";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [regions, motos, clients, riders, stations] = await Promise.all([
    db.region.findMany({
      include: { _count: { select: { motos: true, riders: true } } },
      orderBy: { name: "asc" },
    }),
    db.moto.count(),
    db.client.count(),
    db.rider.count(),
    db.batteryStation.count(),
  ]);

  const stats = [
    { label: "Regions", value: regions.length },
    { label: "Motos", value: motos },
    { label: "Clients", value: clients },
    { label: "Riders", value: riders },
    { label: "Estacions de bateries", value: stations },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            KOMOBI HD Fleet
          </h1>
          <p className="text-muted-foreground text-sm">
            Plataforma de gestió de flota B2B · Cooltra
          </p>
        </div>
        <Badge variant="secondary">Fonaments · v0</Badge>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Regions</CardTitle>
          <CardDescription>
            Dades sembrades des de <code>prisma/seed.ts</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regió</TableHead>
                <TableHead className="text-right">Motos</TableHead>
                <TableHead className="text-right">Riders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">
                    {r._count.motos}
                  </TableCell>
                  <TableCell className="text-right">
                    {r._count.riders}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/login">Accés backoffice</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/login">App del rider</Link>
        </Button>
      </div>
    </main>
  );
}

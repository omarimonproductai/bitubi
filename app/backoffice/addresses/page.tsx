import { db } from "@/lib/db";
import { requirePermission } from "@/lib/guards";
import { PageHeader } from "@/components/backoffice/page-header";
import { EntityDialog, type FieldConfig } from "@/components/backoffice/entity-dialog";
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
import { createAddress, updateAddress, toggleAddressStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  await requirePermission("addresses:write");

  const [addresses, regions] = await Promise.all([
    db.address.findMany({
      include: { region: true },
      orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
    }),
    db.region.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const regionOptions = regions.map((r) => ({ value: r.id, label: r.name }));

  const fields = (a?: (typeof addresses)[number]): FieldConfig[] => [
    { name: "regionId", label: "Regió", type: "select", options: regionOptions, defaultValue: a?.regionId, required: true },
    { name: "name", label: "Nom", required: true, defaultValue: a?.name, placeholder: "Ex: Cooltra HQ" },
    { name: "street", label: "Carrer", required: true, defaultValue: a?.street },
    { name: "postcode", label: "Codi postal", required: true, defaultValue: a?.postcode },
    { name: "city", label: "Ciutat", required: true, defaultValue: a?.city },
  ];

  return (
    <>
      <PageHeader title="Adreces" description="Botigues i HUBs de Cooltra per regió">
        <EntityDialog
          title="Nova adreça"
          triggerLabel="Nova adreça"
          action={createAddress}
          fields={fields()}
        />
      </PageHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Regió</TableHead>
                <TableHead>Adreça</TableHead>
                <TableHead>Estat</TableHead>
                <TableHead className="text-right">Accions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    Encara no hi ha adreces.
                  </TableCell>
                </TableRow>
              )}
              {addresses.map((a) => {
                const active = a.status === "ACTIVE";
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.region.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.street}, {a.postcode} {a.city}
                    </TableCell>
                    <TableCell>
                      <Badge variant={active ? "default" : "secondary"}>
                        {active ? "Activa" : "Baixa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <EntityDialog
                          title="Editar adreça"
                          triggerLabel="Editar"
                          triggerVariant="ghost"
                          action={updateAddress}
                          hidden={{ id: a.id }}
                          fields={fields(a)}
                        />
                        <InlineAction action={toggleAddressStatus.bind(null, a.id, !active)}>
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

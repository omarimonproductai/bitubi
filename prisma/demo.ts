import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();
const DEV_PASSWORD = "komobi123";

/**
 * Escenari de demo clicable sobre les dades del seed (JETA · Barcelona).
 * Re-executable: neteja les dades DEMO abans de tornar-les a crear.
 *
 * Personatges (password komobi123):
 *  - aicha@demo.com   → vehicle vinculat + incidència LLEU + cita de taller (segueix repartint)
 *  - youssef@demo.com → vehicle vinculat BLOQUEJAT (incidència bloquejant) → pot deixar-lo i agafar substitució
 *  - nur@demo.com     → recepció de vehicle pendent (Cooltra ha de "Vincular")
 *  - leo@demo.com     → sense vehicle + notificació "moto reparada disponible"
 *  - Moto DEMO-SUB    → vehicle de substitució de JETA/Barcelona amb codi 51234
 */
async function main() {
  const pw = await hash(DEV_PASSWORD);

  const region = await db.region.findUnique({ where: { name: "Barcelona" } });
  const client = await db.client.findUnique({ where: { name: "JETA" } });
  if (!region || !client) {
    throw new Error("Executa primer `npm run db:seed` (falten Barcelona/JETA).");
  }
  await db.regionClient.upsert({
    where: { regionId_clientId: { regionId: region.id, clientId: client.id } },
    update: {},
    create: { regionId: region.id, clientId: client.id },
  });

  const catalog = await db.incidentCatalog.findMany({
    where: { clientId: client.id },
  });
  const leve = catalog.find((c) => c.type === "LEVE");
  const blocking = catalog.find((c) => c.type === "BLOCKING");

  // --- Neteja demo anterior ---
  const oldRiders = await db.rider.findMany({
    where: { email: { endsWith: "@demo.com" } },
  });
  const oldRiderIds = oldRiders.map((r) => r.id);
  const oldMotos = await db.moto.findMany({
    where: { plate: { startsWith: "DEMO-" } },
  });
  const oldMotoIds = oldMotos.map((m) => m.id);

  await db.notification.deleteMany({ where: { riderId: { in: oldRiderIds } } });
  await db.ticket.deleteMany({
    where: { OR: [{ riderId: { in: oldRiderIds } }, { motoId: { in: oldMotoIds } }] },
  });
  await db.motoRiderAssignment.deleteMany({
    where: { OR: [{ riderId: { in: oldRiderIds } }, { motoId: { in: oldMotoIds } }] },
  });
  await db.motoClientAssignment.deleteMany({ where: { motoId: { in: oldMotoIds } } });
  await db.maintenancePlan.deleteMany({ where: { motoId: { in: oldMotoIds } } });
  await db.rider.deleteMany({ where: { email: { endsWith: "@demo.com" } } });
  await db.moto.deleteMany({ where: { plate: { startsWith: "DEMO-" } } });

  // --- Motos DEMO (Barcelona) ---
  async function makeMoto(plate: string, isSubstitution: boolean, seatCode?: string) {
    const moto = await db.moto.create({
      data: { plate, regionId: region!.id },
    });
    await db.motoClientAssignment.create({
      data: {
        motoId: moto.id,
        clientId: client!.id,
        regionId: region!.id,
        isSubstitution,
        seatCode: seatCode ?? null,
      },
    });
    return moto;
  }
  const motoAicha = await makeMoto("DEMO-A01", false);
  const motoYoussef = await makeMoto("DEMO-Y01", false);
  const motoNur = await makeMoto("DEMO-N01", false);
  await makeMoto("DEMO-SUB1", true, "51234");

  // --- Riders DEMO ---
  async function makeRider(email: string) {
    return db.rider.create({
      data: { email, passwordHash: pw, clientId: client!.id, regionId: region!.id },
    });
  }
  const aicha = await makeRider("aicha@demo.com");
  const youssef = await makeRider("youssef@demo.com");
  const nur = await makeRider("nur@demo.com");
  const leo = await makeRider("leo@demo.com");

  const now = Date.now();

  // Aïcha: vehicle vinculat + incidència LLEU oberta + cita de taller
  await db.motoRiderAssignment.create({
    data: {
      motoId: motoAicha.id,
      riderId: aicha.id,
      receptionAt: new Date(now - 3 * 86400_000),
      status: "LINKED",
      linkedAt: new Date(now - 3 * 86400_000),
    },
  });
  if (leve) {
    const appt = new Date(now + 2 * 86400_000);
    await db.ticket.create({
      data: {
        motoId: motoAicha.id,
        riderId: aicha.id,
        catalogId: leve.id,
        status: "OPEN",
        workshopAppointmentAt: appt,
      },
    });
    await db.notification.create({
      data: {
        riderId: aicha.id,
        type: "WORKSHOP_APPOINTMENT",
        message: `Cita de taller: ${appt.toLocaleString("ca-ES")}`,
      },
    });
  }

  // Youssef: vehicle vinculat BLOQUEJAT (incidència bloquejant oberta)
  await db.motoRiderAssignment.create({
    data: {
      motoId: motoYoussef.id,
      riderId: youssef.id,
      receptionAt: new Date(now - 5 * 86400_000),
      status: "LINKED",
      linkedAt: new Date(now - 5 * 86400_000),
    },
  });
  if (blocking) {
    await db.ticket.create({
      data: {
        motoId: motoYoussef.id,
        riderId: youssef.id,
        catalogId: blocking.id,
        status: "OPEN",
      },
    });
  }

  // Nur: recepció pendent (demà a les 9:00)
  const reception = new Date(now + 86400_000);
  reception.setHours(9, 0, 0, 0);
  await db.motoRiderAssignment.create({
    data: {
      motoId: motoNur.id,
      riderId: nur.id,
      receptionAt: reception,
      status: "RECEPTION",
    },
  });

  // Leo: sense vehicle + notificació de moto reparada disponible
  await db.notification.create({
    data: {
      riderId: leo.id,
      type: "TICKET_CLOSED",
      message: "La teva moto ja està reparada i disponible per recollir.",
    },
  });

  // Mantenim ent dinàmic per a la moto d'Aïcha
  await db.maintenancePlan.create({
    data: { motoId: motoAicha.id, currentKm: 9200, nextMaintenanceKm: 19200 },
  });

  console.log("Demo muntada ✔");
  console.log("Riders (password komobi123):");
  console.log("  aicha@demo.com   → vehicle vinculat + incidència lleu + cita taller");
  console.log("  youssef@demo.com → vehicle bloquejat (deixa'l i agafa substitució DEMO-SUB1, codi 51234)");
  console.log("  nur@demo.com     → recepció pendent (backoffice: Vincular)");
  console.log("  leo@demo.com     → sense vehicle + avís de moto disponible");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

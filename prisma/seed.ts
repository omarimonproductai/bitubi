import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

// Password conegut per a l'entorn de desenvolupament.
const DEV_PASSWORD = "komobi123";

async function main() {
  const pw = await hash(DEV_PASSWORD);

  // --- Regions + adreces de botigues Cooltra (dades d'exemple) ---
  const regionsData = [
    {
      name: "Barcelona",
      address: {
        name: "Cooltra HQ Barcelona",
        street: "C/ Reina Cristina 2",
        postcode: "08003",
        city: "Barcelona",
      },
    },
    {
      name: "Granada",
      address: {
        name: "Cooltra Granada",
        street: "Calle Escritor Antonio Almagro",
        postcode: "18015",
        city: "Granada",
      },
    },
    {
      name: "València",
      address: {
        name: "Cooltra València",
        street: "Calle del Mar 54",
        postcode: "46003",
        city: "València",
      },
    },
    {
      name: "Madrid",
      address: {
        name: "Cooltra Madrid",
        street: "Plaza Cánovas del Castillo",
        postcode: "28014",
        city: "Madrid",
      },
    },
    {
      name: "Sevilla",
      address: {
        name: "Cooltra Sevilla",
        street: "Calle Labrador 18",
        postcode: "41007",
        city: "Sevilla",
      },
    },
  ];

  const regions: Record<string, string> = {};
  for (const r of regionsData) {
    const region = await db.region.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        addresses: { create: r.address },
      },
    });
    regions[r.name] = region.id;
  }

  // --- Clients ---
  const clientNames = ["JETA", "Instapack", "Glovo"];
  const clients: Record<string, string> = {};
  for (const name of clientNames) {
    const c = await db.client.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    clients[name] = c.id;
  }

  // --- Relació Regió-Client ---
  const regionClientPairs: [string, string][] = [
    ["JETA", "Barcelona"],
    ["JETA", "Madrid"],
    ["JETA", "València"],
    ["Instapack", "Barcelona"],
    ["Glovo", "Sevilla"],
    ["Glovo", "Granada"],
  ];
  for (const [client, region] of regionClientPairs) {
    await db.regionClient.upsert({
      where: {
        regionId_clientId: {
          regionId: regions[region],
          clientId: clients[client],
        },
      },
      update: {},
      create: { regionId: regions[region], clientId: clients[client] },
    });
  }

  // --- Motos (fins a 50; en sembrem un subconjunt d'exemple) ---
  const seedPlates = ["1234MNM", "4571MCS", "3890NNG"];
  const extraPlates = Array.from({ length: 7 }, (_, i) => {
    const n = String(1000 + i * 137).padStart(4, "0");
    return `${n}KLM`;
  });
  const regionCycle = ["Barcelona", "Madrid", "València", "Sevilla", "Granada"];
  const allPlates = [...seedPlates, ...extraPlates];
  for (let i = 0; i < allPlates.length; i++) {
    const region = regionCycle[i % regionCycle.length];
    await db.moto.upsert({
      where: { plate: allPlates[i] },
      update: {},
      create: { plate: allPlates[i], regionId: regions[region] },
    });
  }

  // --- Riders (email inventat, no verificable) ---
  const riderData = [
    { email: "1318907@mail.com", client: "JETA", region: "Barcelona" },
    { email: "190223@mail.com", client: "JETA", region: "Madrid" },
    { email: "090912@mail.com", client: "Glovo", region: "Sevilla" },
  ];
  for (const r of riderData) {
    await db.rider.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        passwordHash: pw,
        clientId: clients[r.client],
        regionId: regions[r.region],
      },
    });
  }

  // --- Catàleg d'incidències per a JETA (lleu / bloquejant) ---
  const jetaIncidents = [
    { name: "Intermitente no funciona", type: "LEVE" as const },
    { name: "Retrovisor roto", type: "LEVE" as const },
    { name: "Frenos no responden", type: "BLOCKING" as const },
    { name: "La moto no arranca", type: "BLOCKING" as const },
  ];
  for (const inc of jetaIncidents) {
    const exists = await db.incidentCatalog.findFirst({
      where: { clientId: clients["JETA"], name: inc.name },
    });
    if (!exists) {
      await db.incidentCatalog.create({
        data: { clientId: clients["JETA"], name: inc.name, type: inc.type },
      });
    }
  }

  // --- Usuaris de backoffice (3 rols separats) ---
  const backofficeUsers = [
    { email: "admin@cooltra.com", role: "ADMIN" as const, regionId: null },
    {
      email: "responsable.bcn@cooltra.com",
      role: "REGION_MANAGER" as const,
      regionId: regions["Barcelona"],
    },
    {
      email: "gestor.riders@cooltra.com",
      role: "RIDER_MANAGER" as const,
      regionId: null,
    },
  ];
  for (const u of backofficeUsers) {
    await db.backofficeUser.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: pw,
        role: u.role,
        regionId: u.regionId,
      },
    });
  }

  // --- Estacions de canvi de bateries (Barcelona, dades d'exemple) ---
  const stations = [
    {
      name: "Estació Arc de Triomf",
      address: "Passeig de Lluís Companys 1, 08018 Barcelona",
      lat: 41.3911,
      lng: 2.1806,
      batteriesAbove80: 6,
    },
    {
      name: "Estació Sagrada Família",
      address: "Carrer de Provença 450, 08013 Barcelona",
      lat: 41.4036,
      lng: 2.1744,
      batteriesAbove80: 3,
    },
  ];
  for (const s of stations) {
    const exists = await db.batteryStation.findFirst({
      where: { name: s.name },
    });
    if (!exists) await db.batteryStation.create({ data: s });
  }

  console.log("Seed complet.");
  console.log(`Password de desenvolupament per a tots els usuaris: ${DEV_PASSWORD}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

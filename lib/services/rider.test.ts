import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  getActiveAssignment,
  getSubstitutionMotos,
  selfAssignSubstitution,
  openSeat,
  leaveVehicle,
  reportRiderIncident,
} from "./rider";

const db = new PrismaClient();
const P = `TEST_RID_${Date.now()}_`;

let regionId: string;
let clientId: string;
let subMotoId: string;
let riderId: string;
let leveCatalogId: string;

before(async () => {
  const region = await db.region.create({ data: { name: `${P}R` } });
  regionId = region.id;
  const client = await db.client.create({ data: { name: `${P}C` } });
  clientId = client.id;
  await db.regionClient.create({ data: { regionId, clientId } });

  const sub = await db.moto.create({ data: { plate: `${P}S`, regionId } });
  subMotoId = sub.id;
  await db.motoClientAssignment.create({
    data: { motoId: sub.id, clientId, regionId, isSubstitution: true, seatCode: "54321" },
  });

  const rider = await db.rider.create({
    data: { email: `${P}r@mail.com`, passwordHash: "x", clientId, regionId },
  });
  riderId = rider.id;

  const cat = await db.incidentCatalog.create({
    data: { clientId, name: `${P}Llum`, type: "LEVE" },
  });
  leveCatalogId = cat.id;
});

after(async () => {
  await db.ticket.deleteMany({ where: { motoId: subMotoId } });
  await db.motoRiderAssignment.deleteMany({ where: { riderId } });
  await db.motoClientAssignment.deleteMany({ where: { motoId: subMotoId } });
  await db.incidentCatalog.deleteMany({ where: { clientId } });
  await db.rider.deleteMany({ where: { email: { startsWith: P } } });
  await db.moto.deleteMany({ where: { plate: { startsWith: P } } });
  await db.regionClient.deleteMany({ where: { clientId } });
  await db.client.deleteMany({ where: { name: { startsWith: P } } });
  await db.region.deleteMany({ where: { name: { startsWith: P } } });
  await db.$disconnect();
});

test("substitution motos are listed for the rider's client+region", async () => {
  const subs = await getSubstitutionMotos(riderId);
  assert.equal(subs.length, 1);
  assert.equal(subs[0].motoId, subMotoId);
});

test("rider self-assigns a substitution moto (becomes LINKED)", async () => {
  const res = await selfAssignSubstitution(riderId, subMotoId);
  assert.equal(res.ok, true);
  const active = await getActiveAssignment(riderId);
  assert.equal(active?.status, "LINKED");
  assert.equal(active?.motoId, subMotoId);
});

test("open seat rejects wrong code and accepts the right one", async () => {
  const bad = await openSeat(riderId, "00000");
  assert.match(bad.error!, /incorrecte/);
  const good = await openSeat(riderId, "54321");
  assert.equal(good.ok, true);
});

test("rider reports an incident on the active vehicle", async () => {
  const res = await reportRiderIncident(riderId, leveCatalogId);
  assert.equal(res.ok, true);
  const count = await db.ticket.count({ where: { motoId: subMotoId, riderId } });
  assert.equal(count, 1);
});

test("leaving the vehicle frees the rider", async () => {
  const res = await leaveVehicle(riderId);
  assert.equal(res.ok, true);
  const active = await getActiveAssignment(riderId);
  assert.equal(active, null);
});

test("cannot self-assign while already having a vehicle", async () => {
  await selfAssignSubstitution(riderId, subMotoId); // re-assign after leaving
  const second = await selfAssignSubstitution(riderId, subMotoId);
  assert.match(second.error!, /Ja tens|ja està agafat/);
});

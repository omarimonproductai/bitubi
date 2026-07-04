import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  createTicket,
  isMotoBlocked,
  setWorkshopAppointment,
  closeTicket,
  generateSeatCodeForMoto,
} from "./incidents";

const db = new PrismaClient();
const P = `TEST_INC_${Date.now()}_`;

let regionId: string;
let clientId: string;
let motoId: string;
let subMotoId: string;
let riderId: string;
let blockingCatalogId: string;

before(async () => {
  const region = await db.region.create({ data: { name: `${P}R` } });
  regionId = region.id;
  const client = await db.client.create({ data: { name: `${P}C` } });
  clientId = client.id;
  await db.regionClient.create({ data: { regionId, clientId } });

  const moto = await db.moto.create({ data: { plate: `${P}1`, regionId } });
  motoId = moto.id;
  await db.motoClientAssignment.create({
    data: { motoId: moto.id, clientId, regionId, isSubstitution: false },
  });
  const sub = await db.moto.create({ data: { plate: `${P}2`, regionId } });
  subMotoId = sub.id;
  await db.motoClientAssignment.create({
    data: { motoId: sub.id, clientId, regionId, isSubstitution: true },
  });

  const rider = await db.rider.create({
    data: { email: `${P}r@mail.com`, passwordHash: "x", clientId, regionId },
  });
  riderId = rider.id;

  const cat = await db.incidentCatalog.create({
    data: { clientId, name: `${P}Frens`, type: "BLOCKING" },
  });
  blockingCatalogId = cat.id;
});

after(async () => {
  await db.notification.deleteMany({ where: { riderId } });
  await db.ticket.deleteMany({ where: { motoId: { in: [motoId, subMotoId] } } });
  await db.motoClientAssignment.deleteMany({ where: { motoId: { in: [motoId, subMotoId] } } });
  await db.incidentCatalog.deleteMany({ where: { clientId } });
  await db.rider.deleteMany({ where: { email: { startsWith: P } } });
  await db.moto.deleteMany({ where: { plate: { startsWith: P } } });
  await db.regionClient.deleteMany({ where: { clientId } });
  await db.client.deleteMany({ where: { name: { startsWith: P } } });
  await db.region.deleteMany({ where: { name: { startsWith: P } } });
  await db.$disconnect();
});

test("a blocking incident blocks the moto", async () => {
  const res = await createTicket({ motoId, riderId, catalogId: blockingCatalogId });
  assert.equal(res.ok, true);
  assert.equal(res.blocking, true);
  assert.equal(await isMotoBlocked(motoId), true);
});

test("workshop appointment notifies the rider", async () => {
  const ticket = await db.ticket.findFirst({ where: { motoId } });
  await setWorkshopAppointment(ticket!.id, new Date());
  const notif = await db.notification.findFirst({
    where: { riderId, type: "WORKSHOP_APPOINTMENT" },
  });
  assert.ok(notif);
});

test("closing the ticket unblocks the moto and notifies the rider", async () => {
  const ticket = await db.ticket.findFirst({ where: { motoId } });
  await closeTicket(ticket!.id);
  assert.equal(await isMotoBlocked(motoId), false);
  const notif = await db.notification.findFirst({
    where: { riderId, type: "TICKET_CLOSED" },
  });
  assert.ok(notif);
});

test("seat code is generated only for substitution motos", async () => {
  const bad = await generateSeatCodeForMoto(motoId);
  assert.match(bad.error!, /substitució/);

  const good = await generateSeatCodeForMoto(subMotoId);
  assert.equal(good.ok, true);
  assert.match(good.code!, /^\d{5}$/);
});

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  assignMotoToClient,
  assignMotoToRider,
  linkAssignment,
  unlinkAssignment,
} from "./assignments";
import { canChangeMotoRegion, clientOperatesInRegion } from "./fleet";

const db = new PrismaClient();
const P = `TEST_${Date.now()}_`;

let regionA: string;
let regionB: string;
let clientId: string;
let otherClientId: string;
let motoId: string;
let riderId: string;

before(async () => {
  const rA = await db.region.create({ data: { name: `${P}RegioA` } });
  const rB = await db.region.create({ data: { name: `${P}RegioB` } });
  regionA = rA.id;
  regionB = rB.id;

  const client = await db.client.create({ data: { name: `${P}Client` } });
  const other = await db.client.create({ data: { name: `${P}Other` } });
  clientId = client.id;
  otherClientId = other.id;

  // El client opera a RegioA (no a RegioB).
  await db.regionClient.create({ data: { regionId: regionA, clientId } });

  const moto = await db.moto.create({
    data: { plate: `${P}0001`, regionId: regionA },
  });
  motoId = moto.id;

  const rider = await db.rider.create({
    data: {
      email: `${P}rider@mail.com`,
      passwordHash: "x",
      clientId,
      regionId: regionA,
    },
  });
  riderId = rider.id;
});

after(async () => {
  await db.motoRiderAssignment.deleteMany({ where: { motoId } });
  await db.motoClientAssignment.deleteMany({ where: { motoId } });
  await db.rider.deleteMany({ where: { email: { startsWith: P } } });
  await db.moto.deleteMany({ where: { plate: { startsWith: P } } });
  await db.regionClient.deleteMany({ where: { clientId } });
  await db.client.deleteMany({ where: { name: { startsWith: P } } });
  await db.region.deleteMany({ where: { name: { startsWith: P } } });
  await db.$disconnect();
});

test("clientOperatesInRegion reflects the Region-Client relation", async () => {
  assert.equal(await clientOperatesInRegion(clientId, regionA), true);
  assert.equal(await clientOperatesInRegion(clientId, regionB), false);
});

test("assignMotoToClient rejects a client that does not operate in the region", async () => {
  const res = await assignMotoToClient(motoId, otherClientId, false);
  assert.equal(res.ok, undefined);
  assert.match(res.error!, /no opera/);
});

test("assignMotoToClient succeeds for an operating client", async () => {
  const res = await assignMotoToClient(motoId, clientId, false);
  assert.equal(res.ok, true);
});

test("assignMotoToRider requires a matching client assignment", async () => {
  const res = await assignMotoToRider(motoId, riderId, new Date());
  assert.equal(res.ok, true);
});

test("assignMotoToRider blocks a second active assignment", async () => {
  const res = await assignMotoToRider(motoId, riderId, new Date());
  assert.match(res.error!, /assignació activa|moto assignada/);
});

test("canChangeMotoRegion is true while only in RECEPTION", async () => {
  assert.equal(await canChangeMotoRegion(motoId), true);
});

test("linking then region change is blocked", async () => {
  const a = await db.motoRiderAssignment.findFirst({ where: { motoId } });
  const linked = await linkAssignment(a!.id);
  assert.equal(linked.ok, true);
  assert.equal(await canChangeMotoRegion(motoId), false);
});

test("unlink frees the moto immediately", async () => {
  const a = await db.motoRiderAssignment.findFirst({
    where: { motoId, status: "LINKED" },
  });
  const res = await unlinkAssignment(a!.id);
  assert.equal(res.ok, true);
  assert.equal(await canChangeMotoRegion(motoId), true);
});

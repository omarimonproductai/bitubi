# Tasques — KOMOBI HD Fleet · Plataforma de gestió de flota B2B

> Basat en `tasks/prd-komobi-hd-fleet.md`
> Stack: Next.js (App Router) + PostgreSQL (Prisma) + Tailwind + shadcn/ui (tema light)

## Relevant Files

- `package.json` - Dependències (Next.js, Prisma, tailwind, shadcn/ui, zod, react-hook-form, bcrypt/argon2).
- `prisma/schema.prisma` - Esquema de la BD: Region, Address, Moto, Client, RegionClient, Rider, MotoClientAssignment, MotoRiderAssignment, IncidentCatalog, Ticket, BatteryStation, User (backoffice), MaintenancePlan.
- `prisma/seed.ts` - Dades d'exemple: regions, adreces Cooltra, motos, clients, riders.
- `lib/db.ts` - Client Prisma singleton.
- `lib/auth.ts` - Sessions i control de rols (Admin / Responsable de regió / Gestor de riders / Rider).
- `lib/rbac.ts` - Helpers d'autorització per rol i regió.
- `lib/validations/*.ts` - Esquemes zod compartits entre formularis i API.
- `components/ui/*` - Components shadcn/ui (button, card, dialog, sheet, table, badge, form, select, sonner, input-otp, tabs).
- `components/data-table.tsx` - Taula reutilitzable amb cerca/filtre/paginació per al backoffice.
- `app/(backoffice)/layout.tsx` - Layout amb sidebar de navegació del backoffice.
- `app/(backoffice)/regions/page.tsx` - CRUD de regions.
- `app/(backoffice)/addresses/page.tsx` - CRUD d'adreces per regió.
- `app/(backoffice)/motos/page.tsx` - CRUD de motos i assignació de regió.
- `app/(backoffice)/clients/page.tsx` - CRUD de clients i relació Regió-Client.
- `app/(backoffice)/riders/page.tsx` - CRUD de riders + alta massiva.
- `app/(backoffice)/assignments/page.tsx` - Assignació moto→client i moto→rider (recepció/vincular/desvincular).
- `app/(backoffice)/incidents/page.tsx` - Catàleg d'incidències per client i gestió de tickets.
- `app/(backoffice)/tickets-map/page.tsx` - Mapa de tickets oberts.
- `app/(backoffice)/riders-control/page.tsx` - Panell de control de riders.
- `app/(backoffice)/comms/page.tsx` - Comunicació directa amb riders.
- `app/(rider)/layout.tsx` - Layout mobile-first de la web app del rider.
- `app/(rider)/login/page.tsx` - Login del rider (email + password).
- `app/(rider)/reception/page.tsx` - Recepció del vehicle.
- `app/(rider)/vehicle/page.tsx` - Vehicle vinculat + deixar vehicle.
- `app/(rider)/incident/page.tsx` - Reportar incidència amb foto.
- `app/(rider)/substitution/page.tsx` - Vehicles de substitució + obrir seient (codi 5 dígits).
- `app/(rider)/batteries/page.tsx` - Mapa d'estacions de bateries.
- `app/qr/[motoId]/page.tsx` - Reporte d'incidència per QR sense usuari.
- `app/api/**/route.ts` - Endpoints (assignacions, tickets, notificacions, bulk import, generació de codi, QR).
- `lib/services/*.ts` - Lògica de negoci (assignació, substitució, notificacions, regles d'integritat de flota).
- `lib/storage.ts` - Pujada de fotos d'incidència (S3/compatible, URL signada).
- `lib/maps.ts` - Deep links a Google Maps.
- `lib/notifications.ts` - Enviament d'avisos (cierre de ticket, cita de taller).

### Notes

- Tests unitaris al costat del codi (`X.ts` → `X.test.ts`). Prioritzar tests de les **regles d'integritat de flota** i del **flux de substitució**.
- `npx jest [ruta]` per executar tests; sense ruta, tots.
- shadcn/ui s'instal·la per component amb `npx shadcn@latest add <component>`. Tema **light** per defecte (no configurar dark).
- Les regles dures (moto en una sola regió, no moure moto amb rider vinculat, rider = 1 client + 1 regió) s'apliquen a **nivell de servei i de BD** (constraints), no només al front.

## Instructions for Completing Tasks

**IMPORTANT:** A mesura que completis cada tasca, marca-la canviant `- [ ]` per `- [x]` en aquest fitxer. Actualitza el fitxer després de cada sub-tasca, no només en acabar la tasca pare.

## Tasks

- [x] 0.0 Crear branca de feature
  - [x] 0.1 Desenvolupament a la branca designada de la sessió (`claude/commands-directory-setup-wcfj0j`) en lloc d'una branca `feature/…` (restricció de la sessió)

- [ ] 1.0 Fonaments del projecte (Next.js + Postgres + shadcn/ui light, auth i rols, esquema i seed)
  - [x] 1.1 Inicialitzar projecte Next.js (App Router, TypeScript) i configurar Tailwind
  - [x] 1.2 Configurar shadcn/ui amb tema **light**; components base afegits manualment (button, card, input, label, badge, table, sonner) — la resta s'afegiran quan calguin (`ui.shadcn.com` bloquejat pel proxy, el CLI no hi pot accedir)
  - [x] 1.3 Configurar PostgreSQL i Prisma; `lib/db.ts` amb client singleton
  - [x] 1.4 Definir `prisma/schema.prisma` amb totes les entitats i relacions del PRD (secció 4) i les constraints d'integritat (moto↔regió única, rider = 1 client + 1 regió)
  - [x] 1.5 Crear i executar la primera migració
  - [x] 1.6 Implementar auth amb sessions i **4 rols** (Admin Cooltra, Responsable de regió, Gestor de riders, Rider); passwords hashejats (argon2)
  - [x] 1.7 Implementar `lib/rbac.ts` (autorització per rol i, per al responsable, per regió)
  - [x] 1.8 Escriure `prisma/seed.ts` amb dades d'exemple: regions (BCN, Granada, València, Madrid, Sevilla), adreces Cooltra, motos (1234MNM…), clients (JETA/Instapack/Glovo), riders d'exemple
  - [x] 1.9 Tests de les constraints d'integritat de flota → fet a `lib/services/assignments.test.ts` (regla "no moure moto amb rider" + relació Regió-Client)

- [ ] 2.0 Backoffice — Gestió mestra (regions, adreces, motos, clients, riders, roster de rols)
  - [x] 2.1 Layout del backoffice amb sidebar de navegació (filtrada per rol) i guard `requireBackofficeUser`
  - [~] 2.2 Taula reutilitzable: es fa servir `components/ui/table` amb estats buits i `Badge` a totes les pàgines; cerca/filtre/paginació **ajornats** fins que els volums de dades ho requereixin
  - [x] 2.3 CRUD de **regions** (alta/edició/baixa) amb estat actiu/baixa (RF 1)
  - [x] 2.4 CRUD d'**adreces** associades a una regió (RF 2)
  - [x] 2.5 CRUD de **motos** per matrícula amb assignació de regió; validar unicitat de matrícula (RF 3)
  - [x] 2.6 Aplicar regla: moto en **una sola regió** i **bloquejar canvi de regió si té rider vinculat** (RF 4, RF 5) — via `lib/services/fleet.ts`
  - [x] 2.7 CRUD de **clients** (RF 6) i gestió de la relació **Regió-Client** (un client a 1..n regions) (RF 7)
  - [x] 2.8 CRUD de **riders** amb email + password; **generació de password aleatori** i **sense verificació d'email**; associació a 1 client + 1 regió amb validació Regió-Client (RF 8, RF 9)
  - [x] 2.9 **Roster de rols**: assignar rol (Admin / Responsable de regió / Gestor de riders) per usuari de backoffice
  - [x] 2.10 `Badge` d'estats i estats buits a totes les taules
  - [x] 2.11 Tests de les regles d'integritat de motos → cobert per `lib/services/assignments.test.ts` (+ build/typecheck + smoke test de render/auth)

- [x] 3.0 Backoffice — Cicle rider–vehicle (moto→client amb substitució, moto→rider: recepció, vincular, desvincular)
  - [x] 3.1 UI + API per **assignar moto a client** dins d'una regió on el client operi, amb toggle **és_substitució** (RF 10)
  - [x] 3.2 UI + API per **assignar moto a rider** amb **dia i hora** (validant la relació Regió-Client del rider); crea estat **recepció** (RF 11, RF 12)
  - [x] 3.3 Botó **Vincular**: passa la moto a estat **vinculada** (RF 13)
  - [x] 3.4 Botó **Desvincular**: allibera la moto **a l'instant**, sempre immediat (sense comprovació de "en ruta") (RF 14, RF 15)
  - [x] 3.5 Reflectir estats (recepció / vinculada / desvinculada) amb `Badge` i taula d'assignacions actives
  - [x] 3.6 Tests del cicle complet recepció → vincular → desvincular i de les validacions (`lib/services/assignments.test.ts`, 8/8 OK — cobreix també 1.9 i 2.11)

- [x] 4.0 Backoffice — Incidències i loop de substitució (catàleg lleu/bloquejant, tickets, codi "Generar", notificacions, mapa de tickets)
  - [x] 4.1 CRUD del **catàleg d'incidències per client** amb tipus **Lleu / Bloquejant** (RF 16)
  - [x] 4.2 Lògica: incidència **Lleu** manté operativa; **Bloquejant** bloqueja moto (`isMotoBlocked`) i habilita substitució (RF 17)
  - [~] 4.3 Assignació de **moto de substitució** al rider (client+regió) — l'auto-assignació la fa el rider des de l'app (tasca 6.8); el backoffice hi dóna suport amb els codis de substitució
  - [x] 4.4 Botó **"Generar"**: crea un **codi aleatori de 5 dígits** per al vehicle de substitució (RF 18b)
  - [x] 4.5 Gestió de tickets: estats obert / en taller / tancat; en **tancar** → notificació al rider (RF 19)
  - [x] 4.6 **Notificació de cita de taller** (data i hora) (RF 20)
  - [x] 4.7 `lib/notifications.ts`: notificacions in-app (push web v1; ampliable a email/SMS)
  - [x] 4.8 **Mapa de tickets** per zona/regió (RF 24) — geolocalització fina ajornada (no hi ha telemàtica de vehicle)
  - [x] 4.9 Tests del flux bloquejant → notificació → tancament (`lib/services/incidents.test.ts`, 4/4 OK)

- [ ] 5.0 Backoffice — Escala i visibilitat (alta massiva de riders, control de riders, comunicació directa, mantenim ents dinàmics)
  - [ ] 5.1 **Alta massiva de riders** per fitxer (CSV/Excel) amb validació per fila i informe d'errors (RF 21)
  - [ ] 5.2 **Panell de control de riders** (productivitat/rutes) — v1 amb les mètriques disponibles (RF 22; abast pendent)
  - [ ] 5.3 **Comunicació directa**: enviar avís a un o més riders d'una zona/regió (RF 23; canal v1 = push web)
  - [ ] 5.4 **Mantenim ents dinàmics**: recalcular proper manteniment amb km reals després d'intervenció; entrada de km al tancar ticket (RF 25; font de km pendent)
  - [ ] 5.5 Tests d'import massiu (casos vàlids i erronis)

- [ ] 6.0 Web app del rider (mobile-first)
  - [ ] 6.1 Layout **responsive mobile-first** (vertical, una mà) (RF 26)
  - [ ] 6.2 **Login** (email + password) i **Logout** (RF 27, RF 28)
  - [ ] 6.3 **Recepció del vehicle**: on anar, documentació, hora; **buit si no hi ha assignació** (RF 29)
  - [ ] 6.4 **Vehicle vinculat**: pantalla principal quan la moto està vinculada (RF 30)
  - [ ] 6.5 **Deixar el vehicle**: botó de desvinculació (RF 31)
  - [ ] 6.6 **Reportar incidència**: llistat del catàleg del seu client + **pujada de foto** (`lib/storage.ts`) (RF 32)
  - [ ] 6.7 **Vehicles de substitució**: llistat del client+regió; **bloquejat si té vehicle vinculat** (RF 33)
  - [ ] 6.8 **Auto-assignació** de substitució quan no té vehicle vinculat (RF 34)
  - [ ] 6.9 **Obrir seient**: `input-otp` de **5 dígits** + Enviar, validat contra el codi generat al backoffice (RF 35)
  - [ ] 6.10 Mostrar **"moto disponible per recollir"** quan el ticket es tanca (RF 36)
  - [ ] 6.11 **Mapa d'estacions de bateries**: bateries >80% per estació + deep link a **Google Maps** (`lib/maps.ts`) (RF 37)
  - [ ] 6.12 **Reporte per QR sense usuari** (`app/qr/[motoId]`): report sense login amb rate limiting (RF 38)
  - [ ] 6.13 Tests dels fluxos crítics del rider (login, recepció→vinculat, substitució+obrir seient, report d'incidència)

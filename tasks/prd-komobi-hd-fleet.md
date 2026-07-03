# PRD — KOMOBI HD Fleet · Plataforma de gestió de flota B2B

> **Estat:** Esborrany per a validació
> **Autor:** Equip de producte (Cooltra) · **Data:** 2026-07-03
> **Abast d'aquest PRD:** Tot el backlog de l'Anexo I **excepte** integració POT (REQ 12), exportacions (REQ 7 i 8) i SLA per Hub (REQ 17), que queden documentats com a fases futures.
> **Stack objectiu:** Next.js (App Router) + PostgreSQL + Tailwind CSS + shadcn/ui (tema **light**).

---

## 1. Introducció / Visió general

Cooltra ofereix flotes de motos elèctriques a clients B2B de repartiment (JETA, Glovo, Instapack…). Avui la gestió de qui té quina moto, de les incidències i de les substitucions es fa de forma manual i dispersa. Això provoca motos "en el limbo", hores de repartiment perdudes i cap traçabilitat de responsabilitat.

**KOMOBI HD Fleet** és una plataforma que cobreix el cicle de vida complet *regió → adreça → moto → client → rider*, el loop d'incidències (report → substitució → reparació → recuperació) i dóna al rider una **web app responsive** per operar de manera autònoma des del mòbil.

**Problema que resol:** eliminar la gestió manual i donar a Cooltra control i traçabilitat en temps real de cada moto i cada rider, i al rider autonomia per treballar sense dependre de ningú.

**Objectiu:** que un rider pugui rebre, vincular, operar, reportar incidències i substituir el seu vehicle sense intervenció manual de Cooltra, i que l'equip de Cooltra gestioni tota la flota multi-regió i multi-client des d'un únic backoffice.

---

## 2. Objectius (Goals)

1. Donar d'alta/baixa i gestionar **regions, adreces, motos, clients i riders** des d'un backoffice únic.
2. Garantir la **integritat de la flota**: una moto en una sola regió a la vegada; una moto amb rider assignat no es pot moure de regió.
3. Permetre el **cicle complet rider–vehicle**: assignació moto→client (amb marca de substitució), assignació moto→rider amb cita de recepció, vinculació definitiva i desvinculació neta.
4. Oferir un **loop d'incidències** configurable per client (lleu/bloquejant) amb flux de moto de substitució i notificacions de cierre i cita de taller.
5. Donar al rider una **web app responsive** simple i autònoma (login, recepció, vehicle vinculat, desvincular, reportar incidència amb foto, substitució amb obertura de seient per codi, mapa d'estacions de bateries).
6. Reduir el temps d'onboarding de riders de dies a minuts amb **alta massiva (bulk)**.
7. Donar visibilitat operativa: **mapa de tickets**, panell de **control de riders** i **canal de comunicació directa** amb riders.

**Mètrica nord:** 0 hores de repartiment perdudes per moto parada sense flux de substitució.

---

## 3. Actors i rols

| Rol | On opera | Descripció |
|---|---|---|
| **Admin Cooltra** | Backoffice | Gestió mestra global: regions, adreces, motos, clients, catàlegs. Accés a totes les regions. |
| **Responsable de regió** | Backoffice | Gestiona la seva regió: assigna motos a clients (i marca substitució), assigna motos a riders, gestiona incidències. |
| **Gestor de riders** | Backoffice | Dóna d'alta/baixa riders (individual i bulk) i genera els seus passwords aleatoris. |
| **Rider** | Web app responsive | Usa el servei: login, recepció, operativa diària, incidències, substitució, mapa de bateries. |

> Els rols de backoffice poden col·lapsar-se en un únic rol "Operacions Cooltra" a la v1 si es prefereix (veure Open Questions).

---

## 4. Model de dades (conceptual)

| Entitat | Camps clau | Relacions i regles |
|---|---|---|
| **Regió** | `id`, `nom`, `estat` (activa/baixa) | Ex.: Barcelona, Granada, València, Madrid, Sevilla. |
| **Adreça** | `id`, `regió_id`, `nom`, `carrer`, `cp`, `ciutat` | Pertany a **una** regió. Alta/baixa. Representa botigues/HUBs de Cooltra. |
| **Moto** | `id`, `matrícula`, `regió_id`, `estat` | Matrícula única. **A una sola regió a la vegada.** No pot canviar de regió si té rider vinculat. |
| **Client** | `id`, `nom`, `estat` | Ex.: JETA, Instapack, Glovo. Pertany a **una o més** regions (via Regió-Client). |
| **Regió-Client** | `regió_id`, `client_id` | Habilita assignar motos i riders d'aquell client en aquella regió. |
| **Rider** | `id`, `email`, `password_hash`, `client_id`, `regió_id`, `estat` | Email **no verificable** (inventat). Pertany a **un** client i **una** regió. Password generat aleatòriament pel gestor. |
| **Assignació Moto–Client** | `moto_id`, `client_id`, `regió_id`, `és_substitució` (bool) | El responsable de regió assigna la moto a un client i marca si és de substitució per aquell client+regió. |
| **Assignació Moto–Rider** | `moto_id`, `rider_id`, `data_hora_recepció`, `estat` (recepció / vinculada / desvinculada) | Crea la "recepció del vehicle". Requereix prémer **Vincular** per passar a *vinculada*. |
| **Catàleg d'incidències** | `id`, `client_id`, `nom`, `tipus` (lleu / bloquejant) | Llista per **client**. Bloquejant → la moto es bloqueja i s'activa substitució. |
| **Ticket d'incidència** | `id`, `moto_id`, `rider_id`, `catàleg_id`, `foto_url`, `estat` (obert/en taller/tancat) | Reportat pel rider. En tancar → notificació "moto disponible". |
| **Estació de bateries** | `id`, `nom`, `adreça`, `lat`, `lng`, `bateries_>80%` | Punts de canvi de bateria de Cooltra, per al mapa del rider. |
| **Mantenim ent dinàmic** | `moto_id`, `km_actuals`, `proper_manteniment_km` | Es recalcula després de cada intervenció (veure REQ 13; dependència de km — Open Questions). |

**Dades d'exemple (seed) — regions i adreces de botigues Cooltra:**

| Regió | Adreça d'exemple |
|---|---|
| Barcelona | C/ Reina Cristina 2, 08003 Barcelona |
| Granada | Calle Escritor Antonio Almagro, 18015 Granada |
| València | Calle del Mar 54, 46003 València |
| Sevilla | Calle Labrador 18, 41007 Sevilla |
| Madrid | Plaza Cánovas del Castillo, 28014 Madrid |

> Adreces il·lustratives obtingudes de fonts públiques de Cooltra; a validar amb operacions abans de producció.

**Dades d'exemple addicionals:** motos `1234MNM`, `4571MCS`, `3890NNG` (fins a 50); clients `JETA`, `Instapack`, `Glovo`; riders `1318907@mail.com`, `190223@mail.com`, `090912@mail.com`.

---

## 5. Històries d'usuari (User Stories)

**Gestió mestra**
- Com a **Admin Cooltra**, vull donar d'alta/baixa regions perquè la plataforma només mostri les zones on operem.
- Com a **Admin**, vull gestionar les adreces de botiga de cada regió per saber on es recullen/entreguen les motos.
- Com a **Admin**, vull donar d'alta motos per matrícula i assignar-les a una regió, sabent que una moto amb rider no es pot moure.

**Cicle rider–vehicle**
- Com a **responsable de regió**, vull assignar una moto a un client i marcar si és de substitució per gestionar l'estoc de cada client.
- Com a **responsable de regió**, vull assignar una moto a un rider amb dia i hora perquè li aparegui la "recepció del vehicle" a l'app.
- Com a **gestor de Cooltra**, vull prémer "Vincular" per confirmar la vinculació definitiva rider–moto.
- Com a **responsable**, vull desvincular una moto d'un rider perquè torni a estar disponible i el rider en perdi l'accés a l'instant.

**Rider (web app)**
- Com a **rider**, vull fer login amb el meu email i password per entrar a l'app.
- Com a **rider**, vull veure a "Recepció del vehicle" on anar, quina documentació portar i a quina hora.
- Com a **rider**, vull veure la pantalla "Vehicle vinculat" quan Cooltra ha premut "Vincular".
- Com a **rider**, vull poder "Deixar el vehicle" (desvincular) amb un botó.
- Com a **rider**, vull reportar una incidència triant del llistat del meu client i pujant una foto.
- Com a **rider** sense vehicle vinculat, vull veure "Vehicles de substitució" del meu client i regió i auto-assignar-me'n un.
- Com a **rider**, vull "Obrir seient" d'un vehicle de substitució introduint un codi de 5 dígits.
- Com a **rider**, vull rebre avís quan la meva moto ja està reparada i disponible per recollir.
- Com a **rider**, vull un mapa d'estacions de bateries amb quantes bateries hi ha >80% i obrir Google Maps.

**Escala i visibilitat**
- Com a **gestor de riders**, vull donar d'alta 40 riders d'un fitxer per estalviar temps d'onboarding.
- Com a **operacions**, vull veure les incidències obertes en un mapa per prioritzar per zona.
- Com a **operacions**, vull avisar diversos riders alhora per un canal directe.

---

## 6. Requisits funcionals

> Numerats per implementació. Referència `REQ n` = codi de l'Anexo I quan aplica.

### 6.1 Backoffice — Gestió mestra
1. El sistema ha de permetre **crear, editar i donar de baixa regions** (Barcelona, Granada, València, Madrid, Sevilla…).
2. El sistema ha de permetre **crear/editar/baixa adreces**, cada una associada a **una** regió.
3. El sistema ha de permetre **crear/baixa motos** per matrícula i assignar-les a una regió (fins a 50 a l'entorn d'exemple).
4. El sistema ha d'impedir que una moto estigui en més d'una regió a la vegada.
5. El sistema ha d'**impedir moure de regió una moto que té un rider vinculat**.
6. El sistema ha de permetre **crear/baixa clients** (JETA, Instapack, Glovo…).
7. El sistema ha de permetre associar un client a **una o més regions** (relació Regió-Client).
8. El sistema ha de permetre **crear/baixa riders** amb email + password; l'email **no es verifica** (és inventat). El password el **genera aleatòriament** el gestor.
9. Cada rider ha d'estar associat a **un client i una regió**.

### 6.2 Backoffice — Assignacions i operativa *(REQ 1, REQ 3)*
10. El **responsable de regió** ha de poder **assignar una moto a un client** dins d'una regió on el client operi, i marcar-la o no com a **moto de substitució** per aquell client+regió.
11. El sistema ha de permetre **assignar una moto a un rider** (dins de la relació Regió-Client del rider) escollint **dia i hora**; això genera la "recepció del vehicle" a la web app del rider.
12. En l'assignació, la moto queda en estat **recepció** (no vinculada) fins que un gestor premi **Vincular**.
13. En prémer **Vincular**, la moto passa a estat **vinculada** i el rider veu la pantalla "Vehicle vinculat".
14. El sistema ha de permetre **desvincular** la moto del rider; en fer-ho, la web app del rider deixa de mostrar la moto **a l'instant** i la moto queda disponible per reassignar.
15. (Condició d'error a definir) En desvincular, el sistema ha de gestionar el cas de moto en ruta — *bloquejant, pendent de definició (veure Open Questions).*

### 6.3 Backoffice — Incidències *(REQ 4, REQ 5, REQ 6, REQ 9)*
16. El sistema ha de permetre configurar, **a nivell de client**, un **llistat d'incidències** i marcar cada una com a **Lleu** o **Bloquejant**.
17. Una incidència **Lleu** manté la moto operativa amb incidència oberta; una **Bloquejant** bloqueja la moto automàticament i activa el flux de substitució.
18. Quan una moto queda bloquejada, el sistema ha d'assignar al rider una **moto de substitució** del seu client+regió i registrar check-out de la titular / check-in de la substitució.
19. El taller/operacions ha de poder **tancar un ticket**; en tancar-lo, el rider rep una **notificació** que la moto està reparada i disponible per recollir *(REQ 6)*.
20. El sistema ha de poder enviar una **notificació de cita de taller** per a reparacions lleus (data i hora) *(REQ 9)*.

### 6.4 Backoffice — Onboarding, control i comunicació *(REQ 10, REQ 15, REQ 16)*
21. El sistema ha de permetre **alta massiva de riders per fitxer** (bulk import), validant dades i reportant errors per fila *(REQ 10)*.
22. El sistema ha d'oferir un **panell de control de riders** amb productivitat i patrons de ruta *(REQ 15 — abast a concretar, veure Open Questions)*.
23. El sistema ha d'oferir un **canal de comunicació directa** per enviar avisos a un o més riders d'una zona/regió *(REQ 16 — canal a validar)*.

### 6.5 Backoffice — Visibilitat *(REQ 14)*
24. El sistema ha de mostrar un **mapa de tickets** amb les incidències obertes geolocalitzades per prioritzar per zona *(REQ 14)*.

### 6.6 Backoffice — Mantenim ent *(REQ 13)*
25. El sistema ha de suportar **mantenim ents dinàmics**: recalcular el proper manteniment amb els km reals després de cada intervenció *(REQ 13 — depèn de dades de km; veure Open Questions)*.

### 6.7 Web app del rider *(REQ 2, REQ 11, REQ 18)*
26. La web app ha de ser **responsive**, optimitzada per a **mòbil en vertical**, usable amb una mà *(REQ 11)*.
27. **Login**: només email + password (generat pel gestor). Sense verificació d'email.
28. **Logout**: el rider pot sortir de l'app.
29. **Recepció del vehicle**: pantalla amb on anar, documentació a portar i hora. **Només té contingut si algú li ha assignat un vehicle.**
30. **Vehicle vinculat**: pantalla principal quan la moto està en estat *vinculada*.
31. **Deixar el vehicle**: botó per desvincular-se del vehicle.
32. **Reportar incidència**: llistat d'incidències del seu client (segons catàleg) + pujar una **fotografia**.
33. **Vehicles de substitució**: el rider veu els vehicles de substitució del seu client i regió. **No hi pot fer res si té un vehicle vinculat.**
34. Quan el rider **no té vehicle vinculat** (desvinculat), pot escollir un vehicle de substitució i **auto-assignar-se'l**.
35. En auto-assignar-se una substitució, apareix el botó **"Obrir seient"**: el rider introdueix un **codi de 5 dígits** i prem **Enviar** *(el codi només aplica en aquest flux de substitució; l'obertura del vehicle titular és sense codi — REQ 2)*.
36. Quan el ticket es tanca al backend, la web app ha de mostrar al rider que la seva moto ja està **disponible per recollir**.
37. **Mapa d'estacions de bateries**: mostra les estacions de canvi de bateries de Cooltra; per cada una, **quantes bateries hi ha >80% de càrrega** i un enllaç per **obrir Google Maps** a l'adreça de l'estació.
38. **Reporte per QR sense usuari** *(REQ 18)*: qualsevol persona pot escanejar el QR d'un vehicle i reportar una incidència **sense compte ni login**.

---

## 7. Fora d'abast (Non-Goals)

- **Integració amb POT** (REQ 12) — fase futura.
- **Exportació de tickets i de rutes** (REQ 7 i REQ 8) — fase futura.
- **SLA per Hub** (REQ 17) — fase futura.
- **App nativa** iOS/Android — el rider usa web app responsive.
- **Verificació d'email** dels riders — els emails són inventats i no es verifiquen.
- Facturació, pagaments i integració amb API externes de clients (JETA API) — no en aquesta versió.
- Telemetria/GPS en temps real dels vehicles més enllà del necessari per al mapa de tickets.

---

## 8. Consideracions de disseny (UI/UX) — estil shadcn (light)

- **Sistema de disseny:** shadcn/ui + Tailwind, **tema clar (light)** per defecte. No dark mode en aquesta versió.
- **Backoffice:** layout d'aplicació amb *sidebar* de navegació (Regions, Adreces, Motos, Clients, Riders, Incidències, Tickets, Mapa, Comunicació), taules amb cerca/filtre/paginació (`data-table`), formularis en `Dialog`/`Sheet`, i `Badge` per estats (activa/baixa, lleu/bloquejant, recepció/vinculada/desvinculada, substitució).
- **Paleta:** neutres clars (`background` blanc/`slate-50`), text `slate-900`, un color d'accent per a accions primàries; verd Cooltra (`#003B2F`, present a les taules dels documents) com a accent de marca opcional als headers.
- **Web app rider:** mobile-first, vertical, botons grans i pocs elements per pantalla. Pantalles: Login · Recepció · Vehicle vinculat · Substitució (+ Obrir seient) · Reportar incidència · Mapa bateries. Estats buits clars ("Encara no tens cap vehicle assignat").
- **Components clau shadcn:** `Button`, `Card`, `Dialog`, `Sheet`, `Table`, `Badge`, `Form` (react-hook-form + zod), `Select`, `Toast`/`Sonner` (notificacions), `Tabs`, `Input OTP` (per al codi de 5 dígits d'obrir seient).
- **Accessibilitat:** contrast AA, àrees tàctiles ≥ 44px, estats de càrrega i error explícits.

---

## 9. Consideracions tècniques

- **Stack:** Next.js (App Router) + TypeScript, PostgreSQL (via Prisma o Drizzle), Tailwind + shadcn/ui.
- **Auth:** sessions per a riders (email+password, sense verificació) i per a usuaris de backoffice amb rol. Passwords hashejats (bcrypt/argon2).
- **Multi-tenant lògic:** les dades es filtren per regió i client; el catàleg d'incidències és per client (aïllament entre clients).
- **Integritat de dades (regles dures a nivell de BD/servei):**
  - Moto ↔ una sola regió (FK + constraint).
  - Bloqueig de canvi de regió si existeix assignació moto–rider en estat *vinculada*.
  - Rider ↔ un client + una regió; assignació moto–rider només dins de la relació Regió-Client.
- **Fitxers:** emmagatzematge de fotos d'incidències (S3/compatible) amb URL signada.
- **Notificacions:** cua/servei per a avisos de cierre de ticket i cita de taller (email/push web).
- **Mapa:** integració amb Google Maps (deep link a adreça) per a estacions de bateries i mapa de tickets.
- **Bulk import:** parser CSV/Excel amb validació per fila i informe d'errors.
- **QR sense usuari:** endpoint públic per matrícula/id de vehicle amb rate limiting anti-abús.

---

## 10. Mètriques d'èxit

1. **0 hores** de repartiment perdudes per manca de flux de substitució (moto bloquejant → substitució assignada < X min).
2. Temps d'onboarding de riders reduït de **dies a minuts** amb el bulk import (ex.: 40 riders < 10 min).
3. **100%** de les motos amb regió i responsabilitat traçable (cap moto "en el limbo").
4. **% d'incidències reportades des de l'app** (vs. canals informals) > 80%.
5. Temps mitjà des de "ticket tancat" fins a "rider recull la moto" reduït (elimina dies morts en taller).

---

## 11. Preguntes obertes (Open Questions)

1. **Rols de backoffice:** ¿un únic rol "Operacions Cooltra" a la v1, o tres rols separats (Admin / Responsable de regió / Gestor de riders) des del principi?
2. **Condició d'error de desvinculació (REQ 3):** ¿què passa si es desvincula una moto **en ruta**? Definició bloquejant pendent.
3. **Mantenim ents dinàmics (REQ 13):** sense integració POT ni exportació de rutes, ¿d'on surten els **km reals**? (entrada manual al tancar ticket? lectura del vehicle?) Cal font de dades.
4. **Control de riders (REQ 15):** abast del panell (quines mètriques exactes: km, hores, rutes?) pendent de definir amb JETA/Cooltra.
5. **Canal de comunicació directa (REQ 16):** ¿push a la web app, email, SMS, WhatsApp? Canal concret a validar.
6. **"Obrir seient" amb codi de 5 dígits:** ¿d'on prové el codi (el genera el sistema, el HUB, l'armari físic del vehicle)? Cal definir l'origen i validació del codi.
7. **Mapa de bateries:** ¿font de dades de bateries >80% (API interna de Cooltra)? A la v1 pot ser mock/lectura periòdica.
8. **Notificacions:** ¿push web n'hi ha prou o cal email de fallback per a riders sense app oberta?

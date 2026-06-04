# Guía Web Push + PWA v2 — notificaciones que SÍ llegan (Kappla)

> **Cómo usar este documento.** Pegá el contenido (o adjuntá el archivo) en el chat del
> proyecto a implementar (claseia.app, menuia.app, vamosalrio.com). Pedile que **implemente
> Web Push siguiendo esta guía y que audite cada punto contra su propio código**. Mismo stack
> en todos: **Next.js 14 App Router + TypeScript + Supabase + Vercel + librería `web-push`**.
> Cada problema acá es **real** — nos hizo perder tiempo en mipedido.ar o en claseia.app, y acá
> está cómo se resolvió.

> **Qué logra al final:** el usuario instala la web como app (PWA) en el celu, activa
> notificaciones con un toque, y recibe un push **aunque tenga la app cerrada**. El evento que
> lo dispara y a quién le llega **cambia por proyecto** (ver la última sección).

> **Novedad v2:** se sumaron los errores nuevos encontrados en **claseia.app** — el más
> caro fue el del `NEXT_PUBLIC_` leído en el server (sección 🔴 #7), más el patrón de
> diagnóstico que nos sacó de adivinar (sección 🛠️).

---

## 0. El orden importa: PWA primero, Push después

El Web Push **depende** de la PWA, sobre todo en iPhone. En iOS, las notificaciones web
**solo funcionan si la PWA está instalada en la pantalla de inicio y se abre desde el ícono**
(iOS 16.4+). Orden de implementación:

1. **Fase 1 — PWA instalable** (manifest + service worker + íconos + prompt de instalación)
2. **Fase 2 — Web Push** (claves VAPID + suscripción + envío)

No intentes el push sin la PWA andando primero.

---

## FASE 1 — PWA instalable

### Piezas
1. **`manifest`** (`app/manifest.ts` en App Router): `name`, `short_name`, `theme_color`,
   `background_color`, `display: "standalone"`, `start_url` (la pantalla del usuario logueado),
   e `icons` (192 y 512 px; uno `purpose: "any"` y uno `"maskable"`).
2. **Íconos PNG** del logo, fondo transparente para Android, y un `apple-touch-icon` de **180px**
   con fondo (iOS no soporta transparencia en el ícono). Generar desde el logo real, no
   regenerar con IA (deforma la marca).
3. **Meta tags iOS** en el metadata del layout raíz: `appleWebApp: { capable: true,
   statusBarStyle: "default", title: "..." }` + `apple-touch-icon`. (En Next 14, `themeColor`
   va en `export const viewport`, no en `metadata`, para evitar el warning de deprecación.)
4. **Service worker** (`public/sw.js`): handlers `install`, `activate`, `fetch` y —pensando en
   Fase 2— `push` y `notificationclick`.
   - **`fetch` passthrough**: lo más seguro es NO llamar `event.respondWith()` → el navegador
     resuelve cada request tal cual → **no cachea nada**. Tener el handler presente (aunque no
     intercepte) habilita la instalación en navegadores que lo exigen.
   - **NUNCA cachear `/api` ni `*.supabase.co`** — cachear ahí sirve datos viejos y rompe el
     realtime. Si cacheás, solo assets estáticos.
5. **Componente de prompt de instalación**, montado **solo donde corresponde al usuario
   objetivo**. Android captura `beforeinstallprompt` y muestra botón "Instalar"; iOS muestra
   instrucciones ("Compartir → Agregar a inicio"). Cerrable, que no reaparezca por 7 días
   (localStorage).

### Problemas de Fase 1
- **Manifest con `display: "browser"`**: Chrome NO ofrece instalar si no es `standalone`.
- **Íconos en JPG**: Chrome exige PNG 192 y 512.
- **`start_url`**: si la misma PWA la usan dos roles (ej. docente y alumno), dejala en `/` y
  redirigí por rol. Apuntar a `/admin` mandaría al otro rol a `/login`.

---

## FASE 2 — Web Push

### Piezas
1. **Claves VAPID** (par público/privado, se generan una vez con `npx web-push
   generate-vapid-keys`). Van en env vars (ver 🔴 #7 — ojo cómo se leen):
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (cliente), `VAPID_PUBLIC_KEY` (**runtime, para el server**),
   `VAPID_PRIVATE_KEY` (privada, solo server), `VAPID_EMAIL` (un `mailto:`).
2. **Tabla de suscripciones** en Supabase (ej. `push_subscriptions`): `id uuid PK`, `user_id`
   (o `profesora_id`, etc.), `endpoint text`, `p256dh text`, `auth_key text`, `user_agent`,
   `created_at`. **Constraint único en `(user_id, endpoint)`** — clave para el upsert.
3. **Hook cliente**: pide permiso (`Notification.requestPermission()`, requiere gesto → un
   botón), `pushManager.subscribe({ applicationServerKey: <VAPID pública> })`, y POSTea a un
   endpoint que la guarda.
4. **Endpoint subscribe** (`/api/push/subscribe`): guarda la suscripción.
5. **Endpoint send** (`/api/push/send`): busca las subs del destinatario y envía con `web-push`.
6. **Disparo**: donde ocurre el evento, llamar al envío con el `userId` destinatario correcto.
7. **Service worker**: el handler `push` lee `event.data.json()` y llama `showNotification`
   dentro de `event.waitUntil(...)`; `notificationclick` abre/enfoca la `url` y cierra la notif.

---

## 🔴 LOS PROBLEMAS (todos reales, en orden de cuánto costaron)

### De mipedido.ar (los originales)

**1. El `\n` en las env vars (el clásico, mordió 4+ veces)**
Un `\n` literal al final del valor de una env var (claves VAPID, URLs), heredado de un
copy/paste con comillas → `applicationServerKey` inválida → `subscribe()` tira excepción → el
try/catch se la traga → no se guarda nada.
**Fix:** `.replace(/\\n/g,'').replace(/\n/g,'').trim()` al leer CUALQUIER env var sensible, en
cliente y server. Y limpiar el valor en Vercel.

**2. El "200 mentiroso" del subscribe (upsert con `onConflict` equivocado)**
El endpoint responde 200, pero la tabla queda vacía. El upsert usaba `onConflict: 'user_id'`
pero el único constraint real era `(user_id, endpoint)` → Postgres tira 42P10, y el código no
chequeaba el `{ error }` → devolvía 200 igual.
**Fix:** `onConflict` debe matchear un constraint real (`'user_id,endpoint'`), y SIEMPRE
chequear el `{ error }` → devolver 500 si falla.

**3. RLS bloquea el read del envío**
`/api/push/send` responde 200 con `sent: 0`. El endpoint leía las subs con el cliente sujeto a
RLS, pero quien dispara el envío NO es el dueño de la suscripción → `auth.uid()` no matchea →
0 filas.
**Fix:** el endpoint de envío (interno) lee/borra con **service-role** (bypasea RLS).

**4. El "falso activado"**
La UI dice "activadas" pero nunca se guardó nada (el hook marcaba `subscribed=true` antes de
confirmar el POST).
**Fix:** marcar "activado" SOLO después del 200 del subscribe.

**5. El botón escondido (descubribilidad en mobile)**
Enterrado en el menú hamburguesa. **Fix:** banner/CTA visible en la pantalla principal cuando
`permission === 'default'`; y en iOS `unsupported`, mostrar "📲 agregá la app a tu inicio".

**6. iOS / Apple**
Push en iPhone **solo** con PWA instalada y abierta desde el ícono (iOS 16.4+). Apple Push es
más estricto: el SW debe leer `event.data.json()`, soportar `{titulo, cuerpo, url}` y llamar
`showNotification` dentro de `event.waitUntil(...)`. El `subscribe` usa `userVisibleOnly: true`.

---

### NUEVOS — de claseia.app (la sesión que más costó)

**7. 🟥 EL GRANDE — `NEXT_PUBLIC_` se inyecta en BUILD, no en runtime → trampa al leerla en el server**
Next reemplaza estáticamente `process.env.NEXT_PUBLIC_*` por el literal **en tiempo de build**,
en el bundle (cliente Y server). Si el build vivo no tenía la var (build cache stale, var
agregada después, scope equivocado), en el **server** la referencia queda horneada como string
vacío — aunque Vercel "tenga" la var cargada en runtime.

Síntoma típico: `isPushConfigured()` da `false` y el `/send` corta con 503 "faltan VAPID",
**aunque la cargaste**. Y la asimetría delatora: la **privada** (var normal `VAPID_PRIVATE_KEY`,
sin prefijo) se lee en runtime y anda, pero la **pública** leída de `NEXT_PUBLIC_…` no.

**Fix de raíz (deploy-proof):** en el **server**, leé la pública de una var de **runtime** (sin
prefijo), con fallback al build-inline:
```ts
export const VAPID_PUBLIC = san(
  process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
);
```
Y cargá en Vercel `VAPID_PUBLIC_KEY` (sin prefijo, mismo valor que la pública, es pública = no es
secreto). **El cliente** (el botón) **sigue usando `NEXT_PUBLIC_VAPID_PUBLIC_KEY`** — para el
browser sí debe ser build-time, ahí está bien. Regla general: **nunca dependas de un
`NEXT_PUBLIC_` para lógica de runtime en el server.**

**8. 🟥 El valor en el CAMPO equivocado (Value vs Note)**
En Vercel, la clave privada VAPID estaba pegada en el campo **"Note"** y el campo **"Value"**
tenía otra cosa (¡una clave `sk_live_` de Stripe vieja!). Resultado: la var "existía", scope
correcto, pero el server veía un valor que no era la VAPID → `hasPrivate:false`.
**Fix / chequeo:** verificá que el valor esté en el campo **Value**, no en Note. Como las vars
"Sensitive" no se pueden ver una vez guardadas, ante la duda **sobrescribí el Value** (o borrá
+ re-agregá). Y un valor **viejo/incorrecto** se disfraza de "falta la var".
> Bonus de seguridad: si encontrás una clave de otro servicio (Stripe, etc.) mal puesta,
> revisá dónde debería estar de verdad y, si no sabés de dónde salió, **rotala**.

**9. 🟥 El deploy no es el que creés (desfase de Production)**
Dos trampas juntas:
- **Editar/agregar una env var NO afecta a los deployments existentes** — recién la toma un
  **deploy nuevo**. Si tocaste la var después del build vivo → hay que **redeployar**.
- **Confirmá que el deployment de Production es el último commit.** Si los "deploys frescos"
  salían de otra branch o eran manuales, hay un desfase: tu push está en GitHub pero la prod
  sigue sirviendo código viejo. Verificá: Production trackea `main` + auto-deploy de GitHub on.
- Al redeployar tras cambios de `NEXT_PUBLIC_`, hacelo **sin "Use existing Build Cache"** — el
  `.next/cache` puede arrastrar el valor inlineado viejo (vacío).

**10. In-app ≠ Web Push (no confundas)**
La **campanita / badge** del panel lee de la base de datos al cargar la página → puede mostrar
el evento aunque el push **no** haya salido. Que la campanita ande **no prueba** que el web push
ande. Son dos capas distintas: in-app (dentro de la app) vs push (a nivel sistema operativo,
app cerrada). Probalas por separado.

---

## 🛠️ El patrón que nos sacó de adivinar: el endpoint que se autodelata

Cuando `/send` corta por config, **que la respuesta diga QUÉ ve presente** (booleanos, NUNCA los
valores):
```jsonc
// respuesta del 503
{ "error": "Push no configurado", "hasPublic": true, "hasPrivate": false, "publicFrom": "runtime" }
```
- `hasPublic` / `hasPrivate` → qué env var falta exacto.
- `publicFrom: "runtime" | "build"` → confirma si la pública la lee de runtime (fix #7 aplicado)
  o del build-inline.

Un solo curl pasa de "horas adivinando" a "es exactamente esta var". Curl de prueba:
```bash
curl -s -w "\nHTTP:%{http_code}\n" -X POST https://<tu-dominio>/api/push/send \
  -H "content-type: application/json" \
  -H "x-internal-secret: <PUSH_INTERNAL_SECRET>" \
  -d '{"<id_destinatario>":"...","payload":{"titulo":"Prueba","cuerpo":"Funciona ✓","url":"/"}}'
```
Esperado con todo OK: `{"ok":true,"sent":1,"removed":0,"total":1}`.
- `sent:0, total:1` → la sub existe pero `web-push` la rechazó (VAPID mal, o endpoint caído →
  vendría `removed:1` si fue 410).
- `total:0` → la sub no está en la tabla de ESE proyecto (¿corrió el SQL? ¿se suscribió contra
  esta DB?).

> **Hardening:** protegé `/send` con un header secreto interno (`x-internal-secret`) para que no
> lo dispare cualquiera; y manejá el 410 Gone borrando la sub muerta.

---

## 🧪 Cómo testear (lo que funciona)

1. **Subscribe guardó**: tras "Activar", debe aparecer una fila en `push_subscriptions` (endpoint
   de Apple o Google según el device). Si dio 200 pero no hay fila → "200 mentiroso" (#2).
2. **POST a `/send`** con el id real → `sent:1` (no `sent:0`). Si 0 → RLS del read (#3). Si 503 →
   leé los booleanos del patrón 🛠️ (config / #7 / #8).
3. **End-to-end**: app cerrada → disparar el evento real → debe llegar la notificación del
   **sistema** (no la campanita in-app).
4. **Límite de agentes de navegador** (Claude in Chrome y similares): **no pueden** aceptar el
   diálogo nativo de permisos (vive fuera del DOM, en la chrome del navegador) ni "ver" la
   notificación del SO. Lo que SÍ pueden: crear usuario de prueba, navegar, **chequear la tabla**
   `push_subscriptions`, y **disparar el evento real** (ej. entregar como alumno). La
   confirmación final de que la notif aparece la hace **un humano en un navegador/celu real**.
5. Distinguí siempre **campanita in-app** vs **notif del SO** al verificar (#10).

---

## ✅ Checklist de implementación (en orden)

**Fase 1 — PWA**
- [ ] manifest `standalone` + íconos PNG 192/512 + apple-touch-icon 180 + meta iOS
- [ ] service worker `install/activate/fetch` (passthrough, sin cachear `/api`/Supabase) +
      handlers `push`/`notificationclick` listos
- [ ] prompt de instalación para el usuario objetivo, con instrucciones iOS

**Fase 2 — Push**
- [ ] generar VAPID; cargar en Vercel **sin `\n`**, con `.trim()` en código
- [ ] **server lee la pública de `VAPID_PUBLIC_KEY` (runtime), no de `NEXT_PUBLIC_`** (#7)
- [ ] tabla `push_subscriptions` con **UNIQUE (user_id, endpoint)** + RLS
- [ ] hook que pide permiso (con gesto), subscribe con la VAPID pública, POSTea
- [ ] `/subscribe` con `onConflict` al constraint real, chequea error, 500 si falla (no 200
      mentiroso)
- [ ] `/send` lee/borra con **service-role**; maneja 410 borrando la sub; header secreto interno
- [ ] respuesta de config-fail con **booleanos `{hasPublic, hasPrivate, publicFrom}`** (#patrón)
- [ ] disparo del envío en el evento real, con el `userId` correcto
- [ ] marcar "activado" solo tras 200 del subscribe; banner visible; mensaje iOS unsupported

**Operación / Vercel (los que más engañan)**
- [ ] valor en el campo **Value**, NO en Note (#8)
- [ ] env var en scope **Production** (no solo Preview/Dev)
- [ ] tras editar env vars → **redeploy** (las existentes no las toman) (#9)
- [ ] redeploy **sin build cache** cuando cambió un `NEXT_PUBLIC_` (#9)
- [ ] el deployment de **Production = último commit** de `main`, auto-deploy on (#9)

---

## El "quién recibe qué" cambia por proyecto

La mecánica es idéntica; lo que define cada proyecto es **qué evento dispara el push y a quién**:

- **mipedido.ar** → *nuevo pedido* → al **comercio**.
- **claseia.app** → *un alumno entrega un trabajo* → a la **profesora dueña del curso**.
  (La campanita in-app ya existía; el web push se enganchó **en el mismo evento**, al lado del
  `crearNotificacion`, leyendo las subs de esa profesora.)
- **menuia.app** → *nuevo pedido* → al **comercio / mozo**.
- **vamosalrio.com** → a definir (ej. *alguien pide unirse a una salida* → al **organizador**;
  o *nueva salida* → a interesados). Pensá bien el `userId` destinatario antes de codear.

---

*v2 — destilada de Web Push + PWA en mipedido.ar y claseia.app. Stack Kappla: Next.js 14 App
Router, TypeScript, Supabase, Vercel, librería `web-push`.*

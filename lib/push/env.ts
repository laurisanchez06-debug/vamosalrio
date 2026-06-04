// Lectura y saneo de las env vars de Web Push (VAPID).
//
// Lección #7 de la guía (la que más costó en claseia.app): Next reemplaza
// `process.env.NEXT_PUBLIC_*` por un literal EN TIEMPO DE BUILD. Si el build
// vivo no tenía la var, en el SERVER queda horneada como string vacío aunque
// Vercel "tenga" la var en runtime. Por eso, en el server leemos la pública
// desde `VAPID_PUBLIC_KEY` (var de runtime, sin prefijo), con fallback al
// build-inline `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. El cliente (el botón/hook) SÍ
// usa `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, que para el browser debe ser build-time.
//
// Y saneamos SIEMPRE: un `\n` literal heredado de un copy/paste invalida la
// clave y hace fallar subscribe()/sendNotification() en silencio (lección #1).

function san(value: string | undefined): string {
  return (value ?? "").replace(/\\n/g, "").replace(/\n/g, "").trim();
}

// Pública leída en el SERVER: runtime primero, build-inline como fallback.
export function vapidPublicKey(): string {
  return san(process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

// De dónde salió la pública: "runtime" si vino de VAPID_PUBLIC_KEY (fix #7
// aplicado), "build" si cayó al fallback NEXT_PUBLIC_ (build-inline).
export function vapidPublicFrom(): "runtime" | "build" {
  return san(process.env.VAPID_PUBLIC_KEY) ? "runtime" : "build";
}

export function vapidPrivateKey(): string {
  return san(process.env.VAPID_PRIVATE_KEY);
}

export function vapidSubject(): string {
  const email = san(process.env.VAPID_EMAIL);
  if (!email) return "mailto:comercial@kapplasrl.com";
  return email.startsWith("mailto:") ? email : `mailto:${email}`;
}

export function pushInternalSecret(): string {
  return san(process.env.PUSH_INTERNAL_SECRET);
}

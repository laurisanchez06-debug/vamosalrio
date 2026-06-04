import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  vapidPublicFrom,
  vapidPrivateKey,
  vapidPublicKey,
  vapidSubject,
} from "./env";

export type PushPayload = { titulo: string; cuerpo: string; url?: string };

export type PushConfigStatus = {
  ok: boolean;
  hasPublic: boolean;
  hasPrivate: boolean;
  publicFrom: "runtime" | "build";
};

// Patrón autodelator: el endpoint /send usa esto para responder QUÉ ve presente
// (booleanos, nunca los valores) cuando falta config.
export function pushConfigStatus(): PushConfigStatus {
  const hasPublic = Boolean(vapidPublicKey());
  const hasPrivate = Boolean(vapidPrivateKey());
  return {
    ok: hasPublic && hasPrivate,
    hasPublic,
    hasPrivate,
    publicFrom: vapidPublicFrom(),
  };
}

let vapidListo = false;
function asegurarVapid() {
  if (vapidListo) return;
  webpush.setVapidDetails(vapidSubject(), vapidPublicKey(), vapidPrivateKey());
  vapidListo = true;
}

export type EnvioResultado = { sent: number; removed: number; total: number };

// Envía un push a uno o varios usuarios. Lee/borra las subs con SERVICE-ROLE
// (lección #3: quien dispara el envío NO es el dueño de la sub, así que con el
// cliente sujeto a RLS leería 0 filas). Maneja el 410/404 borrando la sub
// muerta (lección de hardening).
export async function enviarPushAUsuarios(
  userIds: string | string[],
  payload: PushPayload,
): Promise<EnvioResultado> {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (ids.length === 0) return { sent: 0, removed: 0, total: 0 };

  if (!pushConfigStatus().ok) return { sent: 0, removed: 0, total: 0 };
  asegurarVapid();

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .in("user_id", ids);

  const lista = subs ?? [];
  const cuerpo = JSON.stringify(payload);

  let sent = 0;
  let removed = 0;
  const muertos: string[] = [];

  await Promise.all(
    lista.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint as string,
            keys: { p256dh: s.p256dh as string, auth: s.auth_key as string },
          },
          cuerpo,
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) muertos.push(s.endpoint as string);
      }
    }),
  );

  if (muertos.length > 0) {
    const { error } = await admin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", muertos);
    if (!error) removed = muertos.length;
  }

  return { sent, removed, total: lista.length };
}

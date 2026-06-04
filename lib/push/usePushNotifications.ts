"use client";

import { useCallback, useEffect, useState } from "react";

// El CLIENTE usa la pública build-inline (NEXT_PUBLIC_), que para el browser
// está bien que sea build-time. Saneamos por las dudas (lección #1).
const VAPID_PUBLIC = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "")
  .replace(/\\n/g, "")
  .replace(/\n/g, "")
  .trim();

export type PushEstado =
  | "loading" // todavía no sabemos
  | "unsupported" // el navegador no soporta push
  | "ios-instalar" // iOS sin la PWA instalada: hay que agregar a inicio
  | "default" // soportado, permiso sin pedir
  | "denied" // el usuario bloqueó las notificaciones
  | "granted"; // activado

function esIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function estaInstalada(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (
    window.navigator as unknown as { standalone?: boolean }
  ).standalone;
  return Boolean(standalone || iosStandalone);
}

function soportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function detectar(): PushEstado {
  if (typeof window === "undefined") return "loading";
  // En iOS, PushManager solo existe con la PWA instalada y abierta desde el
  // ícono. Si es iOS y no está instalada, guiamos a agregarla a inicio en vez
  // de ocultar todo.
  if (esIOS() && !estaInstalada()) return "ios-instalar";
  if (!soportado()) return "unsupported";
  const perm = Notification.permission;
  if (perm === "granted") return "granted";
  if (perm === "denied") return "denied";
  return "default";
}

// base64url (VAPID) → Uint8Array para applicationServerKey.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushNotifications() {
  const [estado, setEstado] = useState<PushEstado>("loading");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    setEstado(detectar());
  }, []);

  // Pide permiso (requiere gesto del usuario), se suscribe con la VAPID pública
  // y POSTea a /api/push/subscribe. Marca "granted" SOLO tras el 200 (no falso
  // activado, lección #4).
  const activar = useCallback(async (): Promise<boolean> => {
    if (!soportado() || !VAPID_PUBLIC) return false;
    setTrabajando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "denied" : "default");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
        });
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      if (!res.ok) return false; // no marcamos activado si el guardado falló
      setEstado("granted");
      return true;
    } catch {
      return false;
    } finally {
      setTrabajando(false);
    }
  }, []);

  // Desactivar: borra la sub local y en el server.
  const desactivar = useCallback(async (): Promise<boolean> => {
    if (!soportado()) return false;
    setTrabajando(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const endpoint = sub?.endpoint;
      if (sub) await sub.unsubscribe().catch(() => {});
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      setEstado("default");
      return true;
    } catch {
      return false;
    } finally {
      setTrabajando(false);
    }
  }, []);

  return { estado, trabajando, activar, desactivar };
}

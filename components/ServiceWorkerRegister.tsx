"use client";

import { useEffect } from "react";

// Registra el service worker (/sw.js) al cargar la app. Necesario para la PWA
// instalable y para que el Web Push tenga un registration al que suscribirse.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si el registro falla, la PWA/push simplemente no se activan.
    });
  }, []);

  return null;
}

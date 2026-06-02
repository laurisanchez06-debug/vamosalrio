"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Suscripción realtime a participaciones: cuando cambia una solicitud de
// alguna salida donde el usuario es host, refresca los server components
// (actualiza el badge de la campanita y las listas de solicitudes en vivo).
// Si la suscripción falla, no rompe nada: queda la actualización por navegación.
export default function RealtimeSolicitudes({
  userId,
  salidaIds,
}: {
  userId: string;
  salidaIds: string[];
}) {
  const router = useRouter();
  const idsKey = salidaIds.join(",");

  useEffect(() => {
    if (!userId || salidaIds.length === 0) return;
    const ids = new Set(salidaIds);

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return; // degrada a navegación
    }

    // Canal único por usuario para no duplicar entre pestañas.
    const channel = supabase
      .channel(`solicitudes-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participaciones" },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { salida_id?: string }
            | null;
          if (row?.salida_id && ids.has(row.salida_id)) {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // sin acción
      }
    };
  }, [userId, idsKey, router, salidaIds]);

  return null;
}

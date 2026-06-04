import { createClient } from "@/lib/supabase/server";
import AutoToast from "@/components/AutoToast";
import PushBanner from "@/components/PushBanner";
import FeedClient, { type SalidaFeed } from "./FeedClient";

export const dynamic = "force-dynamic";

const TOAST_MENSAJES: Record<string, string> = {
  "salida-cancelada": "Salida cancelada",
  "password-actualizada": "Contraseña actualizada ✓",
};

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { toast?: string };
}) {
  // El feed es de lectura pública: cualquiera puede ver las salidas abiertas.
  // Las acciones (solicitar unirse) sí piden sesión, en la página de la salida.
  const supabase = createClient();

  // El banner de notificaciones solo tiene sentido para usuarios logueados.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Solo salidas que todavía no ocurrieron: una salida ya vencida que el host
  // aún no finalizó sigue en estado 'abierta', pero no debe perdurar en el feed.
  const ahoraISO = new Date().toISOString();

  const { data } = await supabase
    .from("salidas")
    .select(
      `id, titulo, fecha_hora, cierre_inscripcion, punto_encuentro_texto, punto_encuentro_lat, punto_encuentro_lng, cupos_total, cupos_ocupados, participantes_minimos, transporte, categoria, tipo_otro, edad_min, edad_max, costos, estado, host_id, imagen_portada,
       host:profiles!salidas_host_id_fkey (nombre, foto_url, reputacion_promedio, es_capitan)`,
    )
    .eq("estado", "abierta")
    .eq("es_privada", false)
    .gte("fecha_hora", ahoraISO)
    .order("fecha_hora", { ascending: true });

  const salidas = (data ?? []) as unknown as SalidaFeed[];

  return (
    <div className="px-6 pb-6 pt-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-noche">
          Salidas al río
        </h1>
        <p className="mt-2 text-tinta/70">
          Sumate a una o armá la tuya.
        </p>
      </header>

      {user ? <PushBanner /> : null}

      <FeedClient salidas={salidas} />

      {searchParams.toast && TOAST_MENSAJES[searchParams.toast] ? (
        <AutoToast mensaje={TOAST_MENSAJES[searchParams.toast]} />
      ) : null}
    </div>
  );
}

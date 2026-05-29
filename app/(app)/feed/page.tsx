import { createClient } from "@/lib/supabase/server";
import FeedClient, { type SalidaFeed } from "./FeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("salidas")
    .select(
      `id, titulo, fecha_hora, punto_encuentro_texto, cupos_total, cupos_ocupados, transporte, costos, estado, host_id,
       host:profiles!salidas_host_id_fkey (nombre, foto_url, reputacion_promedio)`,
    )
    .eq("estado", "abierta")
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

      <FeedClient salidas={salidas} />
    </div>
  );
}

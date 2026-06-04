import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificacionesClient, { type NotifItem } from "./NotificacionesClient";

export const dynamic = "force-dynamic";

export default async function NotificacionesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/notificaciones");

  // Si la tabla todavía no existe (migración 0022 sin aplicar), supabase-js
  // devuelve error y data null → lista vacía, sin romper la página.
  const { data } = await supabase
    .from("notificaciones")
    .select(
      `id, tipo, leida, created_at, salida_id, participacion_id,
       salida:salidas!notificaciones_salida_id_fkey ( titulo ),
       actor:profiles!notificaciones_actor_id_fkey ( nombre ),
       participacion:participaciones!notificaciones_participacion_id_fkey ( estado )`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (data ?? []) as unknown as NotifItem[];

  return (
    <div className="px-6 pt-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-noche">
          Notificaciones
        </h1>
        <p className="mt-2 text-tinta/70">Lo último de tus salidas.</p>
      </header>

      <NotificacionesClient items={items} />
    </div>
  );
}

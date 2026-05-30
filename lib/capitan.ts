import type { SupabaseClient } from "@supabase/supabase-js";

// Criterio del badge "Capitán" — tuneable.
// Es capitán quien organizó al menos MIN_SALIDAS_CAPITAN salidas finalizadas
// y mantiene una reputación de al menos MIN_REP_CAPITAN.
export const MIN_SALIDAS_CAPITAN = 3;
export const MIN_REP_CAPITAN = 4.5;

// Recalcula profiles.es_capitan para un usuario. Recibe el admin client
// (service_role) porque toca profiles de cualquier usuario. Se llama en el
// mismo flujo donde ya se recalcula la reputación (calificar / finalizar).
export async function recalcularEsCapitan(admin: SupabaseClient, userId: string) {
  const { count } = await admin
    .from("salidas")
    .select("id", { count: "exact", head: true })
    .eq("host_id", userId)
    .eq("estado", "finalizada");

  const { data } = await admin
    .from("profiles")
    .select("reputacion_promedio")
    .eq("id", userId)
    .maybeSingle();

  const reputacion = Number(data?.reputacion_promedio ?? 0);
  const esCapitan =
    (count ?? 0) >= MIN_SALIDAS_CAPITAN && reputacion >= MIN_REP_CAPITAN;

  await admin
    .from("profiles")
    .update({ es_capitan: esCapitan })
    .eq("id", userId);
}

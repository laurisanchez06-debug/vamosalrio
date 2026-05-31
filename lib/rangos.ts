import { createAdminClient } from "@/lib/supabase/admin";

// Sistema de rangos en dos tracks. Se recalculan en el mismo flujo donde se
// recalcula reputacion_promedio (calificar / finalizar). Usan service_role
// porque tocan profiles de cualquier usuario (la RLS solo permite el propio).
//
// En cada track se asigna el rango MÁS ALTO que aplica (cascada de mayor a
// menor). La reputación usada es profiles.reputacion_promedio (global).

// Recalcula profiles.rango_host según salidas finalizadas como host + reputación.
export async function calcularRangoHost(userId: string): Promise<string | null> {
  const admin = createAdminClient();

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

  const salidas = count ?? 0;
  const rep = Number(data?.reputacion_promedio ?? 0);

  let rango: string | null = null;
  if (salidas >= 25 && rep >= 4.7) rango = "gran_capitan";
  else if (salidas >= 10 && rep >= 4.5) rango = "capitan_maestro";
  else if (salidas >= 3 && rep >= 4.0) rango = "capitan";
  else if (salidas >= 1) rango = "anfitrion_junior";

  await admin.from("profiles").update({ rango_host: rango }).eq("id", userId);
  return rango;
}

// Recalcula profiles.rango_tripulante según salidas finalizadas como invitado
// (participaciones aceptadas en salidas finalizadas) + reputación.
export async function calcularRangoTripulante(
  userId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { count } = await admin
    .from("participaciones")
    .select("id, salidas!inner(estado)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("estado", "aceptado")
    .eq("salidas.estado", "finalizada");

  const { data } = await admin
    .from("profiles")
    .select("reputacion_promedio")
    .eq("id", userId)
    .maybeSingle();

  const salidas = count ?? 0;
  const rep = Number(data?.reputacion_promedio ?? 0);

  let rango: string | null = null;
  if (salidas >= 15 && rep >= 4.5) rango = "tripulante_veterano";
  else if (salidas >= 5 && rep >= 4.0) rango = "tripulante_experto";
  else if (salidas >= 1) rango = "tripulante";

  await admin
    .from("profiles")
    .update({ rango_tripulante: rango })
    .eq("id", userId);
  return rango;
}

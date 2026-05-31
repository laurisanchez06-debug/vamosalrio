"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularEsCapitan } from "@/lib/capitan";
import { calcularRangoHost, calcularRangoTripulante } from "@/lib/rangos";

type Result = { error: string };

export async function calificarAction(
  salidaId: string,
  formData: FormData,
): Promise<Result | undefined> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Necesitás iniciar sesión." };

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, fecha_hora, estado")
    .eq("id", salidaId)
    .maybeSingle();
  if (!salida) return { error: "No encontramos la salida." };

  const isHost = salida.host_id === user.id;
  let isParticipanteAceptado = false;
  if (!isHost) {
    const { data: p } = await supabase
      .from("participaciones")
      .select("estado")
      .eq("salida_id", salidaId)
      .eq("user_id", user.id)
      .maybeSingle();
    isParticipanteAceptado = p?.estado === "aceptado";
  }
  if (!isHost && !isParticipanteAceptado) {
    return { error: "No participaste de esta salida." };
  }

  const finalizadaOPasada =
    salida.estado === "finalizada" ||
    new Date(salida.fecha_hora).getTime() < Date.now();
  if (!finalizadaOPasada) {
    return { error: "Todavía no se puede calificar esta salida." };
  }

  type Insert = {
    salida_id: string;
    from_user: string;
    to_user: string;
    rol_calificado: "host" | "invitado";
    puntaje: number;
    comentario: string | null;
  };

  const aInsertar: Insert[] = [];
  for (const [key, value] of Array.from(formData.entries())) {
    const match = key.match(/^puntaje_(.+)$/);
    if (!match) continue;
    const toUser = match[1];
    if (toUser === user.id) continue;
    const puntaje = Number(value);
    if (!Number.isFinite(puntaje) || puntaje < 1 || puntaje > 5) continue;
    const comentario = String(formData.get(`comentario_${toUser}`) ?? "")
      .trim()
      .slice(0, 200);
    aInsertar.push({
      salida_id: salidaId,
      from_user: user.id,
      to_user: toUser,
      rol_calificado: toUser === salida.host_id ? "host" : "invitado",
      puntaje,
      comentario: comentario || null,
    });
  }

  if (aInsertar.length === 0) {
    return { error: "Tenés que calificar al menos a una persona." };
  }

  // INSERT ... ON CONFLICT DO NOTHING (upsert con ignoreDuplicates).
  const { error: insertError } = await supabase
    .from("calificaciones")
    .upsert(aInsertar, {
      onConflict: "salida_id,from_user,to_user",
      ignoreDuplicates: true,
    });
  if (insertError) return { error: insertError.message };

  // Recalcular reputacion_promedio para cada to_user.
  // Usamos admin client porque profiles.UPDATE en RLS solo permite el propio
  // usuario actualizarse a sí mismo; esto es un cálculo derivado que requiere
  // bypassar esa policy.
  const admin = createAdminClient();
  const toUserIds = Array.from(new Set(aInsertar.map((c) => c.to_user)));
  for (const toUserId of toUserIds) {
    const { data: rows } = await admin
      .from("calificaciones")
      .select("puntaje")
      .eq("to_user", toUserId);
    if (!rows || rows.length === 0) continue;
    const suma = rows.reduce(
      (s: number, r: { puntaje: number }) => s + Number(r.puntaje),
      0,
    );
    const promedio = Math.round((suma / rows.length) * 10) / 10;
    await admin
      .from("profiles")
      .update({ reputacion_promedio: promedio })
      .eq("id", toUserId);

    await recalcularEsCapitan(admin, toUserId);
    await calcularRangoHost(toUserId);
    await calcularRangoTripulante(toUserId);
  }

  revalidatePath(`/salida/${salidaId}`);
  redirect(`/salida/${salidaId}?toast=calificaciones-enviadas`);
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  aceptarSolicitudAction as _aceptar,
  rechazarSolicitudAction as _rechazar,
} from "@/app/(app)/salida/[id]/actions";

// Marca como leídas todas las notificaciones no leídas del usuario. Usa el
// cliente con RLS (notif_update_own permite update de las propias).
export async function marcarNotificacionesLeidasAction(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notificaciones")
    .update({ leida: true })
    .eq("user_id", user.id)
    .eq("leida", false);
}

// Wrappers para aceptar/rechazar desde la lista de notificaciones (reusan la
// lógica de la salida: cupos, emails, push y la notif al solicitante).
export async function aceptarSolicitudDesdeNotif(
  participacionId: string,
  salidaId: string,
) {
  const r = await _aceptar(participacionId, salidaId);
  revalidatePath("/notificaciones");
  return r;
}

export async function rechazarSolicitudDesdeNotif(
  participacionId: string,
  salidaId: string,
) {
  const r = await _rechazar(participacionId, salidaId);
  revalidatePath("/notificaciones");
  return r;
}

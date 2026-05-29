"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };

export async function solicitarParticipacionAction(
  salidaId: string,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Necesitás iniciar sesión." };

  const { data: salida, error: salidaError } = await supabase
    .from("salidas")
    .select("host_id, cupos_total, cupos_ocupados, estado")
    .eq("id", salidaId)
    .maybeSingle();

  if (salidaError || !salida) {
    return { error: "No encontramos la salida." };
  }
  if (salida.host_id === user.id) {
    return { error: "Sos el host de esta salida." };
  }
  if (salida.estado !== "abierta") {
    return { error: "La salida ya no está abierta." };
  }
  if ((salida.cupos_ocupados ?? 0) >= salida.cupos_total) {
    return { error: "No quedan cupos." };
  }

  const { error } = await supabase.from("participaciones").insert({
    salida_id: salidaId,
    user_id: user.id,
    estado: "pendiente",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya pediste sumarte a esta salida." };
    }
    return { error: error.message };
  }

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

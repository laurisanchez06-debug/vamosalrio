"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularEsCapitan } from "@/lib/capitan";
import {
  emailNuevaSolicitud,
  emailSolicitudAceptada,
  emailSolicitudRechazada,
  emailSalidaFinalizada,
  emailSalidaCancelada,
} from "@/lib/email";

type Result = { ok: true } | { error: string };

async function getSessionUserOrError() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Necesitás iniciar sesión." } as const;
  return { supabase, user, error: null } as const;
}

async function emailDe(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function solicitarParticipacionAction(
  salidaId: string,
  mensaje?: string,
): Promise<Result> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const { data: salida, error: salidaError } = await supabase
    .from("salidas")
    .select("host_id, cupos_total, cupos_ocupados, estado, titulo")
    .eq("id", salidaId)
    .maybeSingle();

  if (salidaError || !salida) return { error: "No encontramos la salida." };
  if (salida.host_id === user.id) return { error: "Sos el host de esta salida." };
  if (salida.estado !== "abierta") return { error: "La salida ya no está abierta." };
  if ((salida.cupos_ocupados ?? 0) >= salida.cupos_total) return { error: "No quedan cupos." };

  const mensajeLimpio = (mensaje ?? "").trim().slice(0, 300);

  const { error } = await supabase.from("participaciones").insert({
    salida_id: salidaId,
    user_id: user.id,
    estado: "pendiente",
    mensaje: mensajeLimpio || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya pediste sumarte a esta salida." };
    return { error: error.message };
  }

  revalidatePath(`/salida/${salidaId}`);

  try {
    const admin = createAdminClient();
    const [hostEmail, prof] = await Promise.all([
      emailDe(admin, salida.host_id),
      supabase.from("profiles").select("nombre").eq("id", user.id).maybeSingle(),
    ]);
    if (hostEmail) {
      await emailNuevaSolicitud({
        to: hostEmail,
        solicitante: prof.data?.nombre ?? "Alguien",
        titulo: salida.titulo ?? "tu salida",
        salidaId,
      });
    }
  } catch {
    // fire-and-forget: el mail nunca rompe la solicitud
  }

  return { ok: true };
}

export async function aceptarSolicitudAction(
  participacionId: string,
  salidaId: string,
): Promise<Result> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, cupos_total, cupos_ocupados, estado, titulo")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida) return { error: "No encontramos la salida." };
  if (salida.host_id !== user.id) return { error: "No sos el host." };
  if ((salida.cupos_ocupados ?? 0) >= salida.cupos_total) {
    return { error: "Ya no quedan cupos para aceptar." };
  }

  const { error: pErr } = await supabase
    .from("participaciones")
    .update({ estado: "aceptado" })
    .eq("id", participacionId)
    .eq("salida_id", salidaId);
  if (pErr) return { error: pErr.message };

  const nuevoOcupado = (salida.cupos_ocupados ?? 0) + 1;
  const nuevoEstado =
    nuevoOcupado >= salida.cupos_total ? "completa" : salida.estado;

  const { error: sErr } = await supabase
    .from("salidas")
    .update({
      cupos_ocupados: nuevoOcupado,
      estado: nuevoEstado,
    })
    .eq("id", salidaId);
  if (sErr) return { error: sErr.message };

  revalidatePath(`/salida/${salidaId}`);

  try {
    const { data: part } = await supabase
      .from("participaciones")
      .select("user_id")
      .eq("id", participacionId)
      .maybeSingle();
    if (part?.user_id) {
      const email = await emailDe(createAdminClient(), part.user_id);
      if (email) {
        await emailSolicitudAceptada({
          to: email,
          titulo: salida.titulo ?? "la salida",
          salidaId,
        });
      }
    }
  } catch {
    // fire-and-forget
  }

  return { ok: true };
}

export async function rechazarSolicitudAction(
  participacionId: string,
  salidaId: string,
): Promise<Result> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, titulo")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida || salida.host_id !== user.id) {
    return { error: "No tenés permiso." };
  }

  const { error } = await supabase
    .from("participaciones")
    .update({ estado: "rechazado" })
    .eq("id", participacionId)
    .eq("salida_id", salidaId);
  if (error) return { error: error.message };

  revalidatePath(`/salida/${salidaId}`);

  try {
    const { data: part } = await supabase
      .from("participaciones")
      .select("user_id")
      .eq("id", participacionId)
      .maybeSingle();
    if (part?.user_id) {
      const email = await emailDe(createAdminClient(), part.user_id);
      if (email) {
        await emailSolicitudRechazada({
          to: email,
          titulo: salida.titulo ?? "la salida",
        });
      }
    }
  } catch {
    // fire-and-forget
  }

  return { ok: true };
}

export async function finalizarSalidaAction(salidaId: string): Promise<Result> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, estado, titulo")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida) return { error: "No encontramos la salida." };
  if (salida.host_id !== user.id) return { error: "No sos el host." };
  if (salida.estado !== "abierta" && salida.estado !== "completa") {
    return { error: "Esta salida ya no se puede finalizar." };
  }

  const { error } = await supabase
    .from("salidas")
    .update({ estado: "finalizada" })
    .eq("id", salidaId);
  if (error) return { error: error.message };

  // El host pudo alcanzar el criterio de Capitán al sumar una salida finalizada.
  const admin = createAdminClient();
  await recalcularEsCapitan(admin, user.id);

  try {
    const { data: aceptados } = await supabase
      .from("participaciones")
      .select("user_id")
      .eq("salida_id", salidaId)
      .eq("estado", "aceptado");
    for (const a of aceptados ?? []) {
      const email = await emailDe(admin, a.user_id);
      if (email) {
        await emailSalidaFinalizada({
          to: email,
          titulo: salida.titulo ?? "tu salida",
          salidaId,
        });
      }
    }
  } catch {
    // fire-and-forget
  }

  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

export async function cancelarSalidaAction(salidaId: string) {
  const session = await getSessionUserOrError();
  if (!session.user) {
    redirect(
      `/salida/${salidaId}?error=${encodeURIComponent("Necesitás iniciar sesión.")}`,
    );
  }
  const { supabase, user } = session;

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, titulo")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida || salida.host_id !== user.id) {
    redirect(
      `/salida/${salidaId}?error=${encodeURIComponent("No sos el host.")}`,
    );
  }

  const { error } = await supabase
    .from("salidas")
    .update({ estado: "cancelada" })
    .eq("id", salidaId);

  if (error) {
    redirect(
      `/salida/${salidaId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  try {
    const admin = createAdminClient();
    const { data: aceptados } = await supabase
      .from("participaciones")
      .select("user_id")
      .eq("salida_id", salidaId)
      .eq("estado", "aceptado");
    for (const a of aceptados ?? []) {
      const email = await emailDe(admin, a.user_id);
      if (email) {
        await emailSalidaCancelada({
          to: email,
          titulo: salida.titulo ?? "la salida",
        });
      }
    }
  } catch {
    // fire-and-forget
  }

  redirect("/feed?toast=salida-cancelada");
}

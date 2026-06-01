"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularEsCapitan } from "@/lib/capitan";
import { calcularRangoHost, calcularRangoTripulante } from "@/lib/rangos";
import { calcularEdad, rangoEdadLabel } from "@/lib/format";
import {
  emailNuevaSolicitud,
  emailSolicitudAceptada,
  emailSolicitudRechazada,
  emailSalidaFinalizada,
  emailSalidaCancelada,
  emailInvitadoSeBajo,
} from "@/lib/email";

const MS_48H = 48 * 60 * 60 * 1000;

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
    .select(
      "host_id, cupos_total, cupos_ocupados, estado, titulo, fecha_hora, cierre_inscripcion, edad_min, edad_max",
    )
    .eq("id", salidaId)
    .maybeSingle();

  if (salidaError || !salida) return { error: "No encontramos la salida." };
  if (salida.host_id === user.id) return { error: "Sos el host de esta salida." };
  if (salida.estado !== "abierta") return { error: "La salida ya no está abierta." };
  if ((salida.cupos_ocupados ?? 0) >= salida.cupos_total) return { error: "No quedan cupos." };

  // Cierre de inscripción: cierre_inscripcion ?? fecha_hora.
  const cierreEfectivo = new Date(
    salida.cierre_inscripcion ?? salida.fecha_hora,
  ).getTime();
  if (Number.isFinite(cierreEfectivo) && Date.now() >= cierreEfectivo) {
    return { error: "La inscripción ya está cerrada." };
  }

  // Rango de edad: la edad del usuario tiene que caer dentro del rango.
  if (salida.edad_min != null || salida.edad_max != null) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("fecha_nacimiento")
      .eq("id", user.id)
      .maybeSingle();
    const edad = calcularEdad(prof?.fecha_nacimiento);
    const rango = rangoEdadLabel(salida.edad_min, salida.edad_max);
    if (
      edad == null ||
      (salida.edad_min != null && edad < salida.edad_min) ||
      (salida.edad_max != null && edad > salida.edad_max)
    ) {
      return { error: `Esta salida es para personas ${rango}.` };
    }
  }

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

// Un invitado aceptado se baja de la salida. Si falta ≤48hs se registra una
// cancelación tardía en su perfil. En ambos casos avisa al host por mail.
// Devuelve si hubo penalidad para que el cliente lo refleje.
export async function dejarSalidaAction(
  salidaId: string,
): Promise<{ ok: true; penalizado: boolean } | { error: string }> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, titulo, fecha_hora, estado, cupos_ocupados")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida) return { error: "No encontramos la salida." };
  if (salida.host_id === user.id) return { error: "Sos el host de esta salida." };
  if (salida.estado !== "abierta" && salida.estado !== "completa") {
    return { error: "Esta salida ya no admite cambios." };
  }

  const { data: part } = await supabase
    .from("participaciones")
    .select("id, estado")
    .eq("salida_id", salidaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!part || part.estado !== "aceptado") {
    return { error: "No estás en la tripulación de esta salida." };
  }

  const tarde = new Date(salida.fecha_hora).getTime() <= Date.now() + MS_48H;
  const admin = createAdminClient();

  // La RLS solo deja al host tocar participaciones → usamos service_role.
  const { error: pErr } = await admin
    .from("participaciones")
    .update({ estado: "cancelado" })
    .eq("id", part.id);
  if (pErr) return { error: pErr.message };

  // Liberar el cupo.
  const nuevoOcupado = Math.max(0, (salida.cupos_ocupados ?? 0) - 1);
  await admin
    .from("salidas")
    .update({
      cupos_ocupados: nuevoOcupado,
      estado: salida.estado === "completa" ? "abierta" : salida.estado,
    })
    .eq("id", salidaId);

  // Penalidad por baja de último momento.
  if (tarde) {
    const { data: prof } = await admin
      .from("profiles")
      .select("cancelaciones_tardias")
      .eq("id", user.id)
      .maybeSingle();
    await admin
      .from("profiles")
      .update({ cancelaciones_tardias: (prof?.cancelaciones_tardias ?? 0) + 1 })
      .eq("id", user.id);
  }

  revalidatePath(`/salida/${salidaId}`);

  try {
    const [hostEmail, prof] = await Promise.all([
      emailDe(admin, salida.host_id),
      supabase.from("profiles").select("nombre").eq("id", user.id).maybeSingle(),
    ]);
    if (hostEmail) {
      await emailInvitadoSeBajo({
        to: hostEmail,
        invitado: prof.data?.nombre ?? "Un tripulante",
        titulo: salida.titulo ?? "tu salida",
        salidaId,
      });
    }
  } catch {
    // fire-and-forget
  }

  return { ok: true, penalizado: tarde };
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

  // El host pudo subir de rango al sumar una salida finalizada.
  const admin = createAdminClient();
  await recalcularEsCapitan(admin, user.id);
  await calcularRangoHost(user.id);
  await calcularRangoTripulante(user.id);

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

const MOTIVOS_CANCELACION = [
  "fuerza_mayor",
  "cuorum_no_alcanzado",
  "personal",
] as const;
type MotivoCancelacion = (typeof MOTIVOS_CANCELACION)[number];

export async function cancelarSalidaAction(salidaId: string, motivo?: string) {
  const session = await getSessionUserOrError();
  if (!session.user) {
    redirect(
      `/salida/${salidaId}?error=${encodeURIComponent("Necesitás iniciar sesión.")}`,
    );
  }
  const { supabase, user } = session;

  const motivoValido = MOTIVOS_CANCELACION.includes(
    motivo as MotivoCancelacion,
  )
    ? (motivo as MotivoCancelacion)
    : "personal";

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, titulo, fecha_hora")
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

    // Motivo personal con ≤48hs: el host también carga con una cancelación
    // tardía. Fuerza mayor o cuórum no alcanzado: sin penalidad para nadie.
    if (motivoValido === "personal") {
      const tarde =
        new Date(salida.fecha_hora).getTime() <= Date.now() + MS_48H;
      if (tarde) {
        const { data: prof } = await admin
          .from("profiles")
          .select("cancelaciones_tardias")
          .eq("id", user.id)
          .maybeSingle();
        await admin
          .from("profiles")
          .update({
            cancelaciones_tardias: (prof?.cancelaciones_tardias ?? 0) + 1,
          })
          .eq("id", user.id);
      }
    }

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

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalcularEsCapitan } from "@/lib/capitan";
import { calcularRangoHost, calcularRangoTripulante } from "@/lib/rangos";
import { calcularEdad, rangoEdadLabel, formatFechaCorta } from "@/lib/format";
import {
  emailNuevaSolicitud,
  emailSolicitudAceptada,
  emailSolicitudRechazada,
  emailSalidaFinalizada,
  emailSalidaCancelada,
  emailInvitadoSeBajo,
} from "@/lib/email";
import { enviarPushAUsuarios } from "@/lib/push/send";
import { crearNotificacion, crearNotificacionChat } from "@/lib/notificaciones";

const MS_48H = 48 * 60 * 60 * 1000;
const CHAT_MAX = 1000;
// Anti-spam del push de chat:
// - "Mirando ahora": si su última lectura es de hace menos de esto, está en el
//   chat → no le mandamos push.
const CHAT_VIENDO_MS = 45 * 1000;
// - Throttle: no más de 1 push por usuario por salida dentro de esta ventana
//   (agrupa los mensajes seguidos en uno solo).
const CHAT_THROTTLE_MS = 2 * 60 * 1000;

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

  const { data: nuevaPart, error } = await supabase
    .from("participaciones")
    .insert({
      salida_id: salidaId,
      user_id: user.id,
      estado: "pendiente",
      mensaje: mensajeLimpio || null,
    })
    .select("id")
    .single();

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
    const nombre = prof.data?.nombre ?? "Alguien";
    const tituloSalida = salida.titulo ?? "tu salida";
    if (hostEmail) {
      await emailNuevaSolicitud({
        to: hostEmail,
        solicitante: nombre,
        titulo: tituloSalida,
        salidaId,
      });
    }
    // Web push al host, al lado del email. Fire-and-forget: nunca rompe la
    // solicitud (va dentro del mismo try/catch).
    await enviarPushAUsuarios(salida.host_id, {
      titulo: "Nueva solicitud 🌊",
      cuerpo: `${nombre} quiere sumarse a ${tituloSalida}`,
      url: "/notificaciones",
    });
  } catch {
    // fire-and-forget: el mail/push nunca rompen la solicitud
  }

  // Notificación in-app al host (centro de notificaciones).
  await crearNotificacion({
    userId: salida.host_id,
    tipo: "solicitud_recibida",
    salidaId,
    actorId: user.id,
    participacionId: nuevaPart?.id ?? null,
  });

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
  revalidatePath("/notificaciones");

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
      // Push al solicitante, al lado del email (fire-and-forget: el try padre
      // ya lo aísla de la acción principal).
      await enviarPushAUsuarios(part.user_id, {
        titulo: "¡Te aceptaron! 🌊",
        cuerpo: `Sos parte de ${salida.titulo ?? "la salida"}`,
        url: `/salida/${salidaId}`,
      });
      await crearNotificacion({
        userId: part.user_id,
        tipo: "solicitud_aceptada",
        salidaId,
        actorId: user.id,
        participacionId,
      });
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
  revalidatePath("/notificaciones");

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
      // Push al solicitante, con tacto (fire-and-forget vía el try padre).
      await enviarPushAUsuarios(part.user_id, {
        titulo: "Sobre tu solicitud",
        cuerpo: `Tu pedido para ${salida.titulo ?? "la salida"} no fue aceptado esta vez`,
        url: "/mis-salidas",
      });
      await crearNotificacion({
        userId: part.user_id,
        tipo: "solicitud_rechazada",
        salidaId,
        actorId: user.id,
        participacionId,
      });
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

  // El estado ya cambió en la DB: revalidamos YA, antes de cualquier tarea
  // secundaria, para que el badge nunca se quede en "Abierta" si algo de lo
  // que sigue (rangos / mails) llegara a fallar.
  revalidatePath(`/salida/${salidaId}`);
  revalidatePath("/feed");

  // El host pudo subir de rango al sumar una salida finalizada. Es un cálculo
  // derivado: si falla, la salida igual quedó finalizada (no rompemos la acción).
  const admin = createAdminClient();
  try {
    await recalcularEsCapitan(admin, user.id);
    await calcularRangoHost(user.id);
    await calcularRangoTripulante(user.id);
  } catch {
    // best-effort: se recalcula en la próxima calificación/finalización.
  }

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

    // Push + notificación in-app a toda la tripulación confirmada (el host es
    // quien cancela, así que queda fuera: no está entre los aceptados).
    const miembros = (aceptados ?? [])
      .map((a) => a.user_id as string)
      .filter(Boolean);
    if (miembros.length > 0) {
      const { data: host } = await admin
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .maybeSingle();
      const hostNombre = host?.nombre ?? "El host";
      const tituloSalida = salida.titulo ?? "la salida";
      const fecha = formatFechaCorta(salida.fecha_hora);

      await enviarPushAUsuarios(miembros, {
        titulo: "Salida cancelada",
        cuerpo: `${hostNombre} canceló ${tituloSalida} del ${fecha}`,
        url: "/mis-salidas",
      });
      for (const uid of miembros) {
        await crearNotificacion({
          userId: uid,
          tipo: "cancelacion",
          salidaId,
          actorId: user.id,
        });
      }
    }
  } catch {
    // fire-and-forget
  }

  redirect("/feed?toast=salida-cancelada");
}

// Primeras palabras del mensaje para el cuerpo del push (sin cortar a la mitad
// de una palabra, con elipsis si se recortó).
function primerasPalabras(texto: string, max = 80): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const ultimoEspacio = corte.lastIndexOf(" ");
  return `${(ultimoEspacio > 40 ? corte.slice(0, ultimoEspacio) : corte).trim()}…`;
}

type ChatMensaje = {
  id: string;
  user_id: string;
  texto: string;
  created_at: string;
};

// Envía un mensaje al chat de la tripulación. Inserta con el cliente sujeto a
// RLS (la policy exige user_id = auth.uid() + ser miembro), y al lado dispara —
// fire-and-forget — el push a la tripulación y la notificación in-app. Devuelve
// el mensaje insertado para que el cliente lo agregue optimista (el realtime
// igual lo reparte al resto).
export async function enviarMensajeChatAction(
  salidaId: string,
  texto: string,
): Promise<{ ok: true; mensaje: ChatMensaje } | { error: string }> {
  const session = await getSessionUserOrError();
  if (!session.user) return { error: session.error! };
  const { supabase, user } = session;

  const limpio = (texto ?? "").trim().slice(0, CHAT_MAX);
  if (!limpio) return { error: "El mensaje está vacío." };

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, titulo, estado")
    .eq("id", salidaId)
    .maybeSingle();
  if (!salida) return { error: "No encontramos la salida." };
  if (salida.estado === "finalizada" || salida.estado === "cancelada") {
    return { error: "Este chat está cerrado." };
  }

  const { data: insertado, error } = await supabase
    .from("chat_mensajes")
    .insert({ salida_id: salidaId, user_id: user.id, texto: limpio })
    .select("id, user_id, texto, created_at")
    .single();
  if (error || !insertado) {
    return { error: error?.message ?? "No pudimos enviar el mensaje." };
  }
  const mensaje = insertado as ChatMensaje;

  // Push + notificación a la tripulación (menos el autor). Fire-and-forget:
  // nunca rompe el envío del mensaje.
  try {
    await notificarChatTripulacion(salida.host_id, salidaId, mensaje, supabase);
  } catch {
    // best-effort
  }

  return { ok: true, mensaje };
}

async function notificarChatTripulacion(
  hostId: string,
  salidaId: string,
  mensaje: ChatMensaje,
  supabase: ReturnType<typeof createClient>,
): Promise<void> {
  // Tripulación confirmada = host + aceptados, menos el autor.
  const { data: aceptados } = await supabase
    .from("participaciones")
    .select("user_id")
    .eq("salida_id", salidaId)
    .eq("estado", "aceptado");

  const destinatarios = Array.from(
    new Set<string>([hostId, ...(aceptados ?? []).map((a) => a.user_id)]),
  ).filter((id) => id && id !== mensaje.user_id);
  if (destinatarios.length === 0) return;

  const admin = createAdminClient();

  // Datos para anti-spam (con service-role, vemos las filas de todos):
  // - lecturas recientes → "está mirando el chat ahora".
  // - últimos push → throttle por destinatario.
  const [{ data: lecturas }, { data: pushEstado }, prof, salidaInfo] =
    await Promise.all([
      admin
        .from("chat_lecturas")
        .select("user_id, leido_at")
        .eq("salida_id", salidaId)
        .in("user_id", destinatarios),
      admin
        .from("chat_push_estado")
        .select("user_id, ultimo_push_at")
        .eq("salida_id", salidaId)
        .in("user_id", destinatarios),
      supabase.from("profiles").select("nombre").eq("id", mensaje.user_id).maybeSingle(),
      supabase.from("salidas").select("titulo").eq("id", salidaId).maybeSingle(),
    ]);

  const ahora = Date.now();
  const viendoAhora = new Set(
    (lecturas ?? [])
      .filter(
        (l) =>
          l.leido_at && ahora - new Date(l.leido_at as string).getTime() < CHAT_VIENDO_MS,
      )
      .map((l) => l.user_id as string),
  );
  const ultimoPush = new Map(
    (pushEstado ?? []).map((p) => [
      p.user_id as string,
      new Date(p.ultimo_push_at as string).getTime(),
    ]),
  );

  const nombre = prof.data?.nombre ?? "Alguien";
  const titulo = salidaInfo.data?.titulo ?? "tu salida";

  // El que está mirando el chat no recibe push NI notificación en el centro
  // (ya está leyendo). El resto: notificación in-app (deduplicada por no-leída)
  // y push solo si pasó la ventana de throttle.
  const aPushear: string[] = [];
  for (const uid of destinatarios) {
    if (viendoAhora.has(uid)) continue;

    await crearNotificacionChat({
      userId: uid,
      salidaId,
      actorId: mensaje.user_id,
    });

    const ultimo = ultimoPush.get(uid);
    if (ultimo != null && ahora - ultimo < CHAT_THROTTLE_MS) continue;
    aPushear.push(uid);
  }

  if (aPushear.length === 0) return;

  await enviarPushAUsuarios(aPushear, {
    titulo: `💬 ${titulo}`,
    cuerpo: `${nombre}: ${primerasPalabras(mensaje.texto)}`,
    url: `/salida/${salidaId}?tab=chat`,
  });

  // Registrar el push para el throttle (upsert por salida+user).
  await admin.from("chat_push_estado").upsert(
    aPushear.map((uid) => ({
      salida_id: salidaId,
      user_id: uid,
      ultimo_push_at: new Date(ahora).toISOString(),
    })),
    { onConflict: "salida_id,user_id" },
  );
}

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Tipos de notificación. Extensible: salida_cancelada, etc.
export type NotifTipo =
  | "solicitud_recibida"
  | "solicitud_aceptada"
  | "solicitud_rechazada"
  | "chat"
  | "cancelacion";

// Inserta una notificación con service-role (el destinatario no suele ser
// auth.uid() de quien dispara). Fire-and-forget: nunca rompe el flujo que la
// llama, y degrada en silencio si la tabla todavía no existe.
export async function crearNotificacion(n: {
  userId: string;
  tipo: NotifTipo;
  salidaId?: string | null;
  actorId?: string | null;
  participacionId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("notificaciones").insert({
      user_id: n.userId,
      tipo: n.tipo,
      salida_id: n.salidaId ?? null,
      actor_id: n.actorId ?? null,
      participacion_id: n.participacionId ?? null,
    });
  } catch {
    // sin notificación: el evento principal igual sigue
  }
}

// Notificación de chat con dedupe por "no leída": si el usuario ya tiene una
// notificación de chat SIN leer para esta salida, no insertamos otra (la
// existente ya significa "tenés mensajes nuevos en X"). Así el centro no se
// inunda con una fila por mensaje: queda una sola entrada por salida hasta que
// el usuario la lee, y recién ahí un mensaje nuevo genera otra. Fire-and-forget.
export async function crearNotificacionChat(n: {
  userId: string;
  salidaId: string;
  actorId?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { count } = await admin
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("user_id", n.userId)
      .eq("salida_id", n.salidaId)
      .eq("tipo", "chat")
      .eq("leida", false);
    if ((count ?? 0) > 0) return;

    await admin.from("notificaciones").insert({
      user_id: n.userId,
      tipo: "chat",
      salida_id: n.salidaId,
      actor_id: n.actorId ?? null,
    });
  } catch {
    // sin notificación: el evento principal igual sigue
  }
}

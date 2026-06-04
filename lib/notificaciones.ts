import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Tipos de notificación. Extensible: chat_mensaje, salida_cancelada, etc.
export type NotifTipo =
  | "solicitud_recibida"
  | "solicitud_aceptada"
  | "solicitud_rechazada";

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

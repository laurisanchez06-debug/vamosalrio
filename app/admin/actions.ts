"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, emailDe } from "./_lib";
import { emailSalidaCancelada } from "@/lib/email";

type Result = { ok: true } | { error: string };

// Bloquear / habilitar un usuario (toggle).
export async function toggleBloqueoAction(
  userId: string,
  bloquear: boolean,
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "No autorizado." };
  if (userId === ctx.userId) return { error: "No podés bloquearte a vos mismo." };

  const { error } = await ctx.admin
    .from("profiles")
    .update({ bloqueado: bloquear })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/usuarios/${userId}`);
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// Cancelar una salida por moderación (sin penalidad para nadie).
export async function adminCancelarSalidaAction(
  salidaId: string,
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "No autorizado." };

  const { data: salida } = await ctx.admin
    .from("salidas")
    .select("titulo, estado")
    .eq("id", salidaId)
    .maybeSingle();
  if (!salida) return { error: "No encontramos la salida." };

  const { error } = await ctx.admin
    .from("salidas")
    .update({ estado: "cancelada" }) // motivo: admin_moderacion (sin penalidad)
    .eq("id", salidaId);
  if (error) return { error: error.message };

  try {
    const { data: aceptados } = await ctx.admin
      .from("participaciones")
      .select("user_id")
      .eq("salida_id", salidaId)
      .eq("estado", "aceptado");
    for (const a of aceptados ?? []) {
      const email = await emailDe(ctx.admin, a.user_id);
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

  revalidatePath("/admin/salidas");
  revalidatePath(`/salida/${salidaId}`);
  return { ok: true };
}

// Desde un reporte: bloquear al reportado y marcar el reporte como resuelto.
export async function bloquearDesdeReporteAction(
  reporteId: string,
  reportadoId: string,
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "No autorizado." };

  await ctx.admin.from("profiles").update({ bloqueado: true }).eq("id", reportadoId);
  await ctx.admin.from("reportes").update({ resuelto: true }).eq("id", reporteId);

  revalidatePath("/admin/reportes");
  return { ok: true };
}

// Desestimar un reporte (marcarlo resuelto sin acción sobre el usuario).
export async function desestimarReporteAction(
  reporteId: string,
): Promise<Result> {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "No autorizado." };

  const { error } = await ctx.admin
    .from("reportes")
    .update({ resuelto: true })
    .eq("id", reporteId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reportes");
  return { ok: true };
}

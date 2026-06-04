import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatFechaLarga } from "@/lib/format";
import { emailRecordatorio } from "@/lib/email";

export const dynamic = "force-dynamic";

type AporteRow = {
  nombre: string;
  categoria: string;
  asignado_a: string | null;
};

// Recordatorio 24hs antes de cada salida. Lo dispara Vercel Cron (ver
// vercel.json) a las 12:00 UTC (9:00 Argentina). Protegido con CRON_SECRET.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const desde = new Date(now + 23 * 60 * 60 * 1000).toISOString();
  const hasta = new Date(now + 25 * 60 * 60 * 1000).toISOString();

  const { data: salidas, error } = await admin
    .from("salidas")
    .select(
      "id, titulo, fecha_hora, punto_encuentro_texto, host_id, participantes_minimos, estado, recordatorio_host_enviado",
    )
    .gte("fecha_hora", desde)
    .lte("fecha_hora", hasta)
    .in("estado", ["abierta", "completa"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cache de emails por userId (el host puede repetirse entre salidas).
  const emailCache = new Map<string, string | null>();
  async function emailDe(userId: string): Promise<string | null> {
    if (emailCache.has(userId)) return emailCache.get(userId) ?? null;
    let email: string | null = null;
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      email = data?.user?.email ?? null;
    } catch {
      email = null;
    }
    emailCache.set(userId, email);
    return email;
  }

  let enviados = 0;

  for (const s of salidas ?? []) {
    const [{ data: aportesData }, { data: partsData }] = await Promise.all([
      admin
        .from("aportes")
        .select("nombre, categoria, asignado_a")
        .eq("salida_id", s.id),
      admin
        .from("participaciones")
        .select("id, user_id, recordatorio_24h_enviado")
        .eq("salida_id", s.id)
        .eq("estado", "aceptado"),
    ]);

    const aportes = (aportesData ?? []) as AporteRow[];
    const aceptados = partsData ?? [];
    const cadaUno = aportes
      .filter((a) => a.categoria === "cada_uno")
      .map((a) => a.nombre);
    const aportesDe = (uid: string) =>
      aportes.filter((a) => a.asignado_a === uid).map((a) => a.nombre);
    const fechaTexto = formatFechaLarga(s.fecha_hora);

    for (const p of aceptados) {
      if (p.recordatorio_24h_enviado) continue;
      const email = await emailDe(p.user_id);
      if (email) {
        await emailRecordatorio({
          to: email,
          titulo: s.titulo ?? "tu salida",
          fechaTexto,
          punto: s.punto_encuentro_texto,
          salidaId: s.id,
          misAportes: aportesDe(p.user_id),
          cadaUno,
        });
        enviados++;
      }
      await admin
        .from("participaciones")
        .update({ recordatorio_24h_enviado: true })
        .eq("id", p.id);
    }

    // Al host SIEMPRE se le avisa una vez (flag propio en salidas), con el
    // conteo de confirmados y el estado del cuórum.
    if (!s.recordatorio_host_enviado) {
      const conf = aceptados.length;
      const min = s.participantes_minimos;
      const partes = [
        `Tenés <strong>${conf}</strong> ${
          conf === 1 ? "tripulante confirmado" : "tripulantes confirmados"
        }.`,
      ];
      if (min != null) {
        partes.push(
          conf >= min
            ? "✅ ¡Ya tienen cuórum!"
            : `⚠️ Todavía no llegaste al mínimo de ${min} participantes. Si querés cancelar sin penalidad, podés hacerlo desde la salida.`,
        );
      }
      const hostEmail = await emailDe(s.host_id);
      if (hostEmail) {
        await emailRecordatorio({
          to: hostEmail,
          titulo: s.titulo ?? "tu salida",
          fechaTexto,
          punto: s.punto_encuentro_texto,
          salidaId: s.id,
          misAportes: aportesDe(s.host_id),
          cadaUno,
          notaHost: partes.join("<br/><br/>"),
        });
        enviados++;
      }
      await admin
        .from("salidas")
        .update({ recordatorio_host_enviado: true })
        .eq("id", s.id);
    }
  }

  return NextResponse.json({
    ok: true,
    salidas: (salidas ?? []).length,
    enviados,
  });
}

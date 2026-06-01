"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TRANSPORTES = [
  "lancha_publica",
  "lancha_privada",
  "lancha_taxi",
  "kayak",
  "a_pie",
  "otro",
] as const;

type CreateResult = { error: string } | undefined;

export async function createSalidaAction(formData: FormData): Promise<CreateResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitás iniciar sesión." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "")
    .trim()
    .slice(0, 500);
  const punto = String(formData.get("punto_encuentro_texto") ?? "").trim();
  const fechaHoraISO = String(formData.get("fecha_hora_iso") ?? "").trim();
  const cuposRaw = Number(formData.get("cupos_total"));
  const minimoRaw = String(formData.get("participantes_minimos") ?? "").trim();
  const transporte = String(formData.get("transporte") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const tipoOtro = String(formData.get("tipo_otro") ?? "").trim().slice(0, 60);
  const queLlevar = String(formData.get("que_llevar") ?? "").trim();
  const esPrivada = String(formData.get("es_privada") ?? "").trim() === "1";
  const cierreISO = String(formData.get("cierre_inscripcion_iso") ?? "").trim();
  const latRaw = String(formData.get("punto_encuentro_lat") ?? "").trim();
  const lngRaw = String(formData.get("punto_encuentro_lng") ?? "").trim();
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  const costosJson = String(formData.get("costos_json") ?? "[]");

  if (!titulo) return { error: "El título es obligatorio." };
  if (!fechaHoraISO) return { error: "Elegí fecha y hora." };
  if (!Number.isFinite(cuposRaw) || cuposRaw < 2 || cuposRaw > 20) {
    return { error: "Los cupos tienen que estar entre 2 y 20." };
  }

  // Cuórum mínimo opcional: null o un entero entre 0 y cupos.
  let participantesMinimos: number | null = null;
  if (minimoRaw) {
    const m = Number(minimoRaw);
    if (Number.isFinite(m) && m >= 0 && m <= cuposRaw) {
      participantesMinimos = Math.round(m);
    }
  }
  if (!transporte || !TRANSPORTES.includes(transporte as (typeof TRANSPORTES)[number])) {
    return { error: "Elegí cómo se llega." };
  }

  // Tipo "Otro" exige especificar cuál (igual que el transporte).
  if (categoria === "otro" && !tipoOtro) {
    return { error: "Contanos qué tipo de salida es." };
  }

  // "Otro" exige especificar cuál (cierra el bug de "Otro sin completar").
  // Como transporte tiene CHECK en la DB, guardamos el detalle prefijado en la
  // descripción para no perder la info.
  let descripcionFinal = descripcion;
  if (transporte === "otro") {
    const otroTxt = String(formData.get("transporte_otro") ?? "")
      .trim()
      .slice(0, 60);
    if (!otroTxt) return { error: "Contanos cómo llegan al agua." };
    descripcionFinal = [`Cómo llegamos: ${otroTxt}`, descripcion]
      .filter(Boolean)
      .join("\n\n");
  }

  const fecha = new Date(fechaHoraISO);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "La fecha no es válida." };
  }

  // Cierre de inscripción (opcional). null = cierra al empezar la salida.
  let cierreInscripcion: string | null = null;
  if (cierreISO) {
    const c = new Date(cierreISO);
    if (Number.isNaN(c.getTime())) {
      return { error: "La fecha de cierre no es válida." };
    }
    if (c.getTime() >= fecha.getTime()) {
      return {
        error: "El cierre de inscripción tiene que ser antes del inicio de la salida.",
      };
    }
    cierreInscripcion = c.toISOString();
  }

  let costos: Array<{ concepto: string; monto: number }> = [];
  try {
    const parsed = JSON.parse(costosJson);
    if (Array.isArray(parsed)) {
      costos = parsed
        .map((c) => ({
          concepto: String(c?.concepto ?? "").trim(),
          monto: Number(c?.monto) || 0,
        }))
        .filter((c) => c.concepto || c.monto > 0);
    }
  } catch {
    costos = [];
  }

  const { data, error } = await supabase
    .from("salidas")
    .insert({
      host_id: user.id,
      tipo: "rio",
      estado: "abierta",
      titulo,
      descripcion: descripcionFinal || null,
      punto_encuentro_texto: punto || null,
      punto_encuentro_lat: lat != null && Number.isFinite(lat) ? lat : null,
      punto_encuentro_lng: lng != null && Number.isFinite(lng) ? lng : null,
      fecha_hora: fecha.toISOString(),
      cupos_total: cuposRaw,
      participantes_minimos: participantesMinimos,
      transporte,
      categoria: categoria || null,
      tipo_otro: categoria === "otro" ? tipoOtro : null,
      costos,
      que_llevar: queLlevar || null,
      es_privada: esPrivada,
      cierre_inscripcion: cierreInscripcion,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No pudimos publicar la salida." };
  }

  redirect(`/salida/${data.id}?nueva=1`);
}

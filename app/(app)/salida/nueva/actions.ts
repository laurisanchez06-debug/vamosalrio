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
  const transporte = String(formData.get("transporte") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const queLlevar = String(formData.get("que_llevar") ?? "").trim();
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
  if (!transporte || !TRANSPORTES.includes(transporte as (typeof TRANSPORTES)[number])) {
    return { error: "Elegí cómo se llega." };
  }

  const fecha = new Date(fechaHoraISO);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "La fecha no es válida." };
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
      descripcion: descripcion || null,
      punto_encuentro_texto: punto || null,
      punto_encuentro_lat: lat != null && Number.isFinite(lat) ? lat : null,
      punto_encuentro_lng: lng != null && Number.isFinite(lng) ? lng : null,
      fecha_hora: fecha.toISOString(),
      cupos_total: cuposRaw,
      transporte,
      categoria: categoria || null,
      costos,
      que_llevar: queLlevar || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No pudimos publicar la salida." };
  }

  redirect(`/salida/${data.id}?nueva=1`);
}

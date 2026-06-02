"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  SALIDAS_BUCKET,
  createAdminClient,
  ensureSalidasBucket,
} from "@/lib/supabase/admin";

const TRANSPORTES = [
  "lancha_publica",
  "lancha_privada",
  "lancha_taxi",
  "kayak",
  "a_pie",
  "otro",
] as const;

type Result = { error: string } | undefined;

type ParsedSalida = {
  titulo: string;
  descripcion: string | null;
  punto_encuentro_texto: string | null;
  punto_encuentro_lat: number | null;
  punto_encuentro_lng: number | null;
  fecha: Date;
  cupos_total: number;
  participantes_minimos: number | null;
  transporte: string;
  categoria: string | null;
  tipo_otro: string | null;
  costos: Array<{ concepto: string; monto: number }>;
  que_llevar: string | null;
  es_privada: boolean;
  cierre_inscripcion: string | null;
  edad_min: number | null;
  edad_max: number | null;
};

// Parseo + validación compartidos por crear y editar.
function parseSalidaForm(
  formData: FormData,
): { error: string } | { values: ParsedSalida } {
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
  const edadMinRaw = String(formData.get("edad_min") ?? "").trim();
  const edadMaxRaw = String(formData.get("edad_max") ?? "").trim();
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

  if (categoria === "otro" && !tipoOtro) {
    return { error: "Contanos qué tipo de salida es." };
  }

  // "Otro" exige especificar cuál. Como transporte tiene CHECK en la DB,
  // guardamos el detalle prefijado en la descripción para no perder la info.
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

  // Rango de edad (opcional). Si viene uno, vienen ambos desde el wizard.
  let edadMin: number | null = null;
  let edadMax: number | null = null;
  if (edadMinRaw || edadMaxRaw) {
    const min = Number(edadMinRaw);
    const max = Number(edadMaxRaw);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { error: "El rango de edad no es válido." };
    }
    if (min < 18) {
      return { error: "La edad mínima tiene que ser 18 o más." };
    }
    if (min > max) {
      return { error: "La edad mínima no puede ser mayor a la máxima." };
    }
    edadMin = Math.round(min);
    edadMax = Math.round(max);
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

  return {
    values: {
      titulo,
      descripcion: descripcionFinal || null,
      punto_encuentro_texto: punto || null,
      punto_encuentro_lat: lat != null && Number.isFinite(lat) ? lat : null,
      punto_encuentro_lng: lng != null && Number.isFinite(lng) ? lng : null,
      fecha,
      cupos_total: cuposRaw,
      participantes_minimos: participantesMinimos,
      transporte,
      categoria: categoria || null,
      tipo_otro: categoria === "otro" ? tipoOtro : null,
      costos,
      que_llevar: queLlevar || null,
      es_privada: esPrivada,
      cierre_inscripcion: cierreInscripcion,
      edad_min: edadMin,
      edad_max: edadMax,
    },
  };
}

// Resuelve la URL de la portada a guardar.
// - Si llega una imagen nueva (ya comprimida en el browser): la sube y devuelve su URL.
// - Si no: conserva la URL actual ("" = sin foto / se quitó → null).
async function resolverPortada(
  formData: FormData,
  userId: string,
): Promise<{ url: string | null } | { error: string }> {
  const file = formData.get("imagen_portada_file");
  const actual = String(formData.get("imagen_portada_actual") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "La foto de portada es demasiado pesada." };
    }
    try {
      await ensureSalidasBucket();
      const admin = createAdminClient();
      const ext = file.type === "image/png"
        ? "png"
        : file.type === "image/jpeg"
          ? "jpg"
          : "webp";
      const path = `${userId}/${Date.now()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await admin.storage
        .from(SALIDAS_BUCKET)
        .upload(path, Buffer.from(arrayBuffer), {
          contentType: file.type || "image/webp",
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = admin.storage
        .from(SALIDAS_BUCKET)
        .getPublicUrl(path);
      return { url: publicUrl.publicUrl };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No pudimos subir la foto de portada.";
      return { error: msg };
    }
  }

  return { url: actual || null };
}

export async function createSalidaAction(formData: FormData): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitás iniciar sesión." };
  }

  const parsed = parseSalidaForm(formData);
  if ("error" in parsed) return parsed;
  const v = parsed.values;

  const portada = await resolverPortada(formData, user.id);
  if ("error" in portada) return portada;

  const { data, error } = await supabase
    .from("salidas")
    .insert({
      host_id: user.id,
      tipo: "rio",
      estado: "abierta",
      titulo: v.titulo,
      imagen_portada: portada.url,
      descripcion: v.descripcion,
      punto_encuentro_texto: v.punto_encuentro_texto,
      punto_encuentro_lat: v.punto_encuentro_lat,
      punto_encuentro_lng: v.punto_encuentro_lng,
      fecha_hora: v.fecha.toISOString(),
      cupos_total: v.cupos_total,
      participantes_minimos: v.participantes_minimos,
      transporte: v.transporte,
      categoria: v.categoria,
      tipo_otro: v.tipo_otro,
      costos: v.costos,
      que_llevar: v.que_llevar,
      es_privada: v.es_privada,
      cierre_inscripcion: v.cierre_inscripcion,
      edad_min: v.edad_min,
      edad_max: v.edad_max,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No pudimos publicar la salida." };
  }

  redirect(`/salida/${data.id}?nueva=1`);
}

export async function updateSalidaAction(
  salidaId: string,
  formData: FormData,
): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitás iniciar sesión." };
  }

  const { data: salida } = await supabase
    .from("salidas")
    .select("host_id, estado, fecha_hora, cupos_ocupados")
    .eq("id", salidaId)
    .maybeSingle();

  if (!salida) return { error: "No encontramos la salida." };
  if (salida.host_id !== user.id) {
    return { error: "Solo el organizador puede editar la salida." };
  }
  if (salida.estado !== "abierta") {
    return { error: "Solo se puede editar una salida abierta." };
  }
  if (new Date(salida.fecha_hora).getTime() < Date.now()) {
    return { error: "No se puede editar una salida que ya pasó." };
  }

  const parsed = parseSalidaForm(formData);
  if ("error" in parsed) return parsed;
  const v = parsed.values;

  if (v.fecha.getTime() < Date.now()) {
    return { error: "La fecha no puede estar en el pasado." };
  }

  // No permitir bajar los cupos por debajo de los ya aceptados.
  const { count: aceptados } = await supabase
    .from("participaciones")
    .select("id", { count: "exact", head: true })
    .eq("salida_id", salidaId)
    .eq("estado", "aceptado");
  const yaAceptados = aceptados ?? 0;
  if (v.cupos_total < yaAceptados) {
    return {
      error: `Ya tenés ${yaAceptados} ${yaAceptados === 1 ? "persona aceptada" : "personas aceptadas"}: los cupos no pueden ser menos.`,
    };
  }

  const portada = await resolverPortada(formData, user.id);
  if ("error" in portada) return portada;

  const { error } = await supabase
    .from("salidas")
    .update({
      titulo: v.titulo,
      imagen_portada: portada.url,
      descripcion: v.descripcion,
      punto_encuentro_texto: v.punto_encuentro_texto,
      punto_encuentro_lat: v.punto_encuentro_lat,
      punto_encuentro_lng: v.punto_encuentro_lng,
      fecha_hora: v.fecha.toISOString(),
      cupos_total: v.cupos_total,
      participantes_minimos: v.participantes_minimos,
      transporte: v.transporte,
      categoria: v.categoria,
      tipo_otro: v.tipo_otro,
      costos: v.costos,
      que_llevar: v.que_llevar,
      es_privada: v.es_privada,
      cierre_inscripcion: v.cierre_inscripcion,
      edad_min: v.edad_min,
      edad_max: v.edad_max,
    })
    .eq("id", salidaId);

  if (error) {
    return { error: error.message ?? "No pudimos guardar los cambios." };
  }

  revalidatePath(`/salida/${salidaId}`);
  redirect(`/salida/${salidaId}`);
}

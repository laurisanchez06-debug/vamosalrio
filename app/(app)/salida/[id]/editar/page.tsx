import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NuevaSalidaForm, {
  type SalidaInicial,
} from "@/app/(app)/salida/nueva/NuevaSalidaForm";

export const dynamic = "force-dynamic";

type Costo = { concepto: string; monto: number };

export default async function EditarSalidaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/salida/${params.id}/editar`)}`);
  }

  const { data: salida } = await supabase
    .from("salidas")
    .select(
      "id, host_id, estado, titulo, descripcion, punto_encuentro_texto, punto_encuentro_lat, punto_encuentro_lng, fecha_hora, cupos_total, participantes_minimos, transporte, categoria, tipo_otro, costos, que_llevar, es_privada, cierre_inscripcion, edad_min, edad_max, imagen_portada",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!salida) notFound();

  // Solo el host puede editar, y solo si la salida está abierta y no pasó.
  const esHost = salida!.host_id === user!.id;
  const pasada = new Date(salida!.fecha_hora).getTime() < Date.now();
  if (!esHost || salida!.estado !== "abierta" || pasada) {
    redirect(`/salida/${params.id}`);
  }

  // Cantidad de aceptados (piso para los cupos).
  const { count } = await supabase
    .from("participaciones")
    .select("id", { count: "exact", head: true })
    .eq("salida_id", params.id)
    .eq("estado", "aceptado");

  // Transporte "Otro": el detalle se guardó prefijado en la descripción.
  let descripcion = salida!.descripcion ?? "";
  let transporteOtro = "";
  if (
    salida!.transporte === "otro" &&
    descripcion.startsWith("Cómo llegamos: ")
  ) {
    const partes = descripcion.split("\n\n");
    transporteOtro = partes[0].replace("Cómo llegamos: ", "").trim();
    descripcion = partes.slice(1).join("\n\n");
  }

  const initial: SalidaInicial = {
    id: salida!.id,
    categoria: salida!.categoria,
    tipoOtro: salida!.tipo_otro,
    transporte: salida!.transporte,
    transporteOtro,
    fechaHoraISO: salida!.fecha_hora,
    puntoEncuentro: salida!.punto_encuentro_texto,
    lat: salida!.punto_encuentro_lat,
    lng: salida!.punto_encuentro_lng,
    titulo: salida!.titulo,
    cupos: salida!.cupos_total,
    minimo: salida!.participantes_minimos,
    costos: Array.isArray(salida!.costos) ? (salida!.costos as Costo[]) : [],
    descripcion,
    queLlevar: salida!.que_llevar,
    esPrivada: Boolean(salida!.es_privada),
    cierreInscripcionISO: salida!.cierre_inscripcion,
    edadMin: salida!.edad_min,
    edadMax: salida!.edad_max,
    imagenPortada: salida!.imagen_portada,
  };

  return (
    <div className="pb-6">
      <div className="px-6 pt-6">
        <Link
          href={`/salida/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver a la salida
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-noche">
          Editar salida
        </h1>
      </div>
      <NuevaSalidaForm initial={initial} aceptados={count ?? 0} />
    </div>
  );
}

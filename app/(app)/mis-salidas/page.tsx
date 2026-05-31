import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MisSalidasTabs, { type MiSalida } from "@/components/MisSalidasTabs";

export const dynamic = "force-dynamic";

type SalidaRow = {
  id: string;
  titulo: string;
  fecha_hora: string;
  estado: string;
  cupos_total: number;
  cupos_ocupados: number;
  host_id: string;
  host?: { nombre: string | null } | { nombre: string | null }[] | null;
};

function unwrap<T>(p: T | T[] | null | undefined): T | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function MisSalidasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/mis-salidas")}`);
  }

  const ahora = Date.now();
  const esPasada = (f: string) => new Date(f).getTime() < ahora;

  const [organizadasRes, participacionesRes, calificacionesRes] = await Promise.all([
    supabase
      .from("salidas")
      .select(
        "id, titulo, fecha_hora, estado, cupos_total, cupos_ocupados, host_id",
      )
      .eq("host_id", user!.id)
      .order("fecha_hora", { ascending: false }),
    supabase
      .from("participaciones")
      .select(
        `estado,
         salida:salidas!participaciones_salida_id_fkey (
           id, titulo, fecha_hora, estado, cupos_total, cupos_ocupados, host_id,
           host:profiles!salidas_host_id_fkey ( nombre )
         )`,
      )
      .eq("user_id", user!.id)
      .in("estado", ["aceptado", "pendiente"]),
    supabase.from("calificaciones").select("salida_id").eq("from_user", user!.id),
  ]);

  const calificadas = new Set(
    ((calificacionesRes.data ?? []) as { salida_id: string }[]).map((c) => c.salida_id),
  );

  const organizadas: MiSalida[] = (
    (organizadasRes.data ?? []) as unknown as SalidaRow[]
  ).map((s) => {
    const pasada = esPasada(s.fecha_hora);
    return {
      id: s.id,
      titulo: s.titulo,
      fecha_hora: s.fecha_hora,
      estado: s.estado,
      cupos_total: s.cupos_total,
      cupos_ocupados: s.cupos_ocupados,
      hostNombre: null,
      pasada,
      necesitaFinalizar:
        pasada && (s.estado === "abierta" || s.estado === "completa"),
      pendienteCalificar: false,
    };
  });

  const partRows = (participacionesRes.data ?? []) as unknown as {
    estado: string;
    salida: SalidaRow | SalidaRow[] | null;
  }[];

  const aItem = (s: SalidaRow): MiSalida => {
    const pasada = esPasada(s.fecha_hora);
    const host = unwrap(s.host);
    return {
      id: s.id,
      titulo: s.titulo,
      fecha_hora: s.fecha_hora,
      estado: s.estado,
      cupos_total: s.cupos_total,
      cupos_ocupados: s.cupos_ocupados,
      hostNombre: host?.nombre ?? null,
      pasada,
      necesitaFinalizar: false,
      pendienteCalificar:
        s.estado !== "cancelada" &&
        (s.estado === "finalizada" || pasada) &&
        !calificadas.has(s.id),
    };
  };

  const porFechaDesc = (a: MiSalida, b: MiSalida) =>
    new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime();

  const participando = partRows
    .filter((p) => p.estado === "aceptado")
    .map((p) => unwrap(p.salida))
    .filter((s): s is SalidaRow => !!s)
    .filter((s) => s.host_id !== user!.id) // tu propia salida va en "Organizadas"
    .map(aItem)
    .sort(porFechaDesc);

  const solicitudes = partRows
    .filter((p) => p.estado === "pendiente")
    .map((p) => unwrap(p.salida))
    .filter((s): s is SalidaRow => !!s)
    .map(aItem)
    .sort(porFechaDesc);

  return (
    <MisSalidasTabs
      organizadas={organizadas}
      participando={participando}
      solicitudes={solicitudes}
    />
  );
}

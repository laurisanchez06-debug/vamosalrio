import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CalificarForm, { type Persona } from "./CalificarForm";

type ConfirmadoRow = {
  user_id: string;
  profile:
    | { nombre: string | null; foto_url: string | null }
    | { nombre: string | null; foto_url: string | null }[]
    | null;
};

function unwrap<T>(p: T | T[] | null): T | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function CalificarPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/salida/${params.id}/calificar`)}`);
  }

  const { data: salida } = await supabase
    .from("salidas")
    .select("id, titulo, fecha_hora, estado, host_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!salida) notFound();

  // Acceso: host o participante aceptado.
  const isHost = salida.host_id === user!.id;
  let isParticipanteAceptado = false;
  if (!isHost) {
    const { data: p } = await supabase
      .from("participaciones")
      .select("estado")
      .eq("salida_id", salida.id)
      .eq("user_id", user!.id)
      .maybeSingle();
    isParticipanteAceptado = p?.estado === "aceptado";
  }
  if (!isHost && !isParticipanteAceptado) {
    redirect(`/salida/${salida.id}`);
  }

  // Salida tiene que estar finalizada o pasada.
  const isFinalizadaOPasada =
    salida.estado === "finalizada" ||
    new Date(salida.fecha_hora).getTime() < Date.now();
  if (!isFinalizadaOPasada) {
    redirect(`/salida/${salida.id}`);
  }

  // Si ya calificó, volver al detalle.
  const { count: yaCalificadas } = await supabase
    .from("calificaciones")
    .select("id", { count: "exact", head: true })
    .eq("salida_id", salida.id)
    .eq("from_user", user!.id);

  if ((yaCalificadas ?? 0) > 0) {
    redirect(`/salida/${salida.id}`);
  }

  // Lista a calificar: host + aceptados, sin el propio usuario.
  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("id, nombre, foto_url")
    .eq("id", salida.host_id)
    .maybeSingle();

  const { data: confirmadosData } = await supabase
    .from("participaciones")
    .select(
      "user_id, profile:profiles!participaciones_user_id_fkey (nombre, foto_url)",
    )
    .eq("salida_id", salida.id)
    .eq("estado", "aceptado");

  const personas: Persona[] = [];
  if (hostProfile && hostProfile.id !== user!.id) {
    personas.push({
      id: hostProfile.id,
      nombre: hostProfile.nombre,
      foto_url: hostProfile.foto_url,
      rol: "host",
    });
  }
  for (const c of (confirmadosData ?? []) as ConfirmadoRow[]) {
    if (c.user_id === user!.id) continue;
    const p = unwrap(c.profile);
    personas.push({
      id: c.user_id,
      nombre: p?.nombre ?? null,
      foto_url: p?.foto_url ?? null,
      rol: "invitado",
    });
  }

  return (
    <div className="px-6 pt-6 pb-10">
      <Link
        href={`/salida/${salida.id}`}
        className="inline-flex items-center gap-2 text-sm text-tinta/60"
      >
        <span aria-hidden>←</span> Volver al detalle
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-noche">
          Calificá la tripulación
        </h1>
        <p className="mt-2 text-tinta/70">
          {salida.titulo}
        </p>
        <p className="mt-3 rounded-2xl bg-rio/10 px-4 py-3 text-sm text-rio">
          Tu opinión arma la reputación de cada uno. Sé honesta/o.
        </p>
      </header>

      <div className="mt-6">
        <CalificarForm salidaId={salida.id} personas={personas} />
      </div>
    </div>
  );
}

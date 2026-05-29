import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TRANSPORTE_LABEL,
  formatFechaCorta,
  formatFechaLarga,
  formatPesos,
} from "@/lib/format";
import BotonParticipar from "./BotonParticipar";
import { BotonesCompartir, IconoCompartirHeader } from "./Compartir";

type Costo = { concepto: string; monto: number };

type ConfirmadoRow = {
  user_id: string;
  profile:
    | { nombre: string | null; foto_url: string | null }
    | { nombre: string | null; foto_url: string | null }[]
    | null;
};

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function unwrapProfile(p: ConfirmadoRow["profile"]) {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function SalidaDetallePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nueva?: string };
}) {
  // El SSR client usa anon cuando no hay sesión (RLS aplica). Si hay sesión,
  // usa authenticated. NO es service_role.
  const supabase = createClient();

  const [{ data: salida }, { data: userData }] = await Promise.all([
    supabase
      .from("salidas")
      .select(
        "id, titulo, descripcion, punto_encuentro_texto, fecha_hora, cupos_total, cupos_ocupados, transporte, costos, que_llevar, estado, host_id",
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!salida) {
    notFound();
  }

  const user = userData.user ?? null;

  // Host (columnas públicas).
  const { data: host } = await supabase
    .from("profiles")
    .select("nombre, foto_url, reputacion_promedio, verificado")
    .eq("id", salida!.host_id)
    .maybeSingle();

  // Estado de participación del usuario actual (si hay sesión).
  let estadoParticipacion:
    | "pendiente"
    | "aceptado"
    | "rechazado"
    | null = null;
  if (user && user.id !== salida!.host_id) {
    const { data: miPart } = await supabase
      .from("participaciones")
      .select("estado")
      .eq("salida_id", salida!.id)
      .eq("user_id", user.id)
      .maybeSingle();
    estadoParticipacion = (miPart?.estado as typeof estadoParticipacion) ?? null;
  }

  // Confirmados (estado = aceptado).
  const { data: confirmadosData } = await supabase
    .from("participaciones")
    .select(
      "user_id, profile:profiles!participaciones_user_id_fkey (nombre, foto_url)",
    )
    .eq("salida_id", salida!.id)
    .eq("estado", "aceptado")
    .order("created_at", { ascending: true });

  const confirmados = (confirmadosData ?? []) as unknown as ConfirmadoRow[];

  const costos = Array.isArray(salida!.costos)
    ? (salida!.costos as Costo[])
    : [];
  const totalCostos = costos.reduce(
    (s, c) => s + (Number(c.monto) || 0),
    0,
  );
  const porPersona =
    salida!.cupos_total > 0
      ? Math.ceil(totalCostos / salida!.cupos_total)
      : 0;

  const cuposLibres = Math.max(
    0,
    salida!.cupos_total - (salida!.cupos_ocupados ?? 0),
  );
  const isHost = user?.id === salida!.host_id;
  const cuposCompletos = cuposLibres === 0 || salida!.estado !== "abierta";
  const recienCreada = searchParams.nueva === "1";

  const shareProps = {
    titulo: salida!.titulo,
    fechaTexto: formatFechaCorta(salida!.fecha_hora),
    punto: salida!.punto_encuentro_texto,
    cuposLibres,
  };

  const confirmadosVisible = confirmados.slice(0, 5);
  const confirmadosExtra = Math.max(0, confirmados.length - 5);

  return (
    <div className="px-6 pt-6 pb-10">
      <div className="flex items-center justify-between">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver al feed
        </Link>
        <IconoCompartirHeader {...shareProps} />
      </div>

      {recienCreada ? (
        <div className="mt-4 rounded-2xl bg-rio/10 px-4 py-3 text-sm font-medium text-rio">
          ✅ Salida publicada — compartila con tu gente.
        </div>
      ) : null}

      <header className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-arena/15 px-3 py-1 text-xs font-medium text-arena">
          {salida!.estado === "abierta" ? "Abierta" : salida!.estado}
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-noche">
          {salida!.titulo}
        </h1>
        {salida!.descripcion ? (
          <p className="mt-3 whitespace-pre-line text-tinta/80">
            {salida!.descripcion}
          </p>
        ) : null}
      </header>

      {host ? (
        <Link
          href={`/perfil/${salida!.host_id}`}
          className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
        >
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-rio text-base font-bold text-crema">
            {host.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={host.foto_url}
                alt={host.nombre ?? "Host"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials(host.nombre)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-tinta/40">
              Host
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-noche">
              <span className="truncate">{host.nombre ?? "Anónimo"}</span>
              {host.verificado ? (
                <span
                  aria-label="Verificado"
                  className="grid h-4 w-4 place-items-center rounded-full bg-rio text-[10px] font-bold text-crema"
                >
                  ✓
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1 text-xs text-tinta/50">
              <span aria-hidden className="text-arena">
                ★
              </span>
              <span>
                {Number(host.reputacion_promedio ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
          <span aria-hidden className="text-tinta/40">
            ›
          </span>
        </Link>
      ) : null}

      {/* CTA principal */}
      <div className="mt-6">
        {!user ? (
          <Link
            href={`/registro?redirect=${encodeURIComponent(`/salida/${salida!.id}`)}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98]"
          >
            Sumate a la tripulación
          </Link>
        ) : isHost ? (
          <a
            href="#solicitudes"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-noche px-6 text-base font-semibold text-crema active:scale-[0.98]"
          >
            Gestionar solicitudes
          </a>
        ) : cuposCompletos && !estadoParticipacion ? (
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
          >
            Cupos completos
          </button>
        ) : (
          <BotonParticipar
            salidaId={salida!.id}
            estadoInicial={estadoParticipacion}
          />
        )}
      </div>

      <section className="mt-6 space-y-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-wide text-tinta/40">
            Cuándo
          </div>
          <div className="mt-1 text-base font-semibold text-noche">
            {formatFechaLarga(salida!.fecha_hora)}
          </div>
        </div>

        {salida!.punto_encuentro_texto ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Punto de encuentro
            </div>
            <div className="mt-1 text-base font-semibold text-noche">
              {salida!.punto_encuentro_texto}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Cupos
            </div>
            <div className="mt-1 text-base font-semibold text-noche">
              {salida!.cupos_ocupados}/{salida!.cupos_total}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Transporte
            </div>
            <div className="mt-1 text-base font-semibold text-noche">
              {TRANSPORTE_LABEL[salida!.transporte] ?? salida!.transporte}
            </div>
          </div>
        </div>

        {costos.length > 0 ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Costos compartidos
            </div>
            <ul className="mt-2 space-y-1 text-sm text-tinta/80">
              {costos.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>{c.concepto || "—"}</span>
                  <span className="font-medium text-noche">
                    {formatPesos(Number(c.monto) || 0)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-tinta/10 pt-3 text-sm">
              <span className="text-tinta/60">Total</span>
              <span className="font-semibold text-noche">
                {formatPesos(totalCostos)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-tinta/60">Por persona</span>
              <span className="font-semibold text-rio">
                {formatPesos(porPersona)}
              </span>
            </div>
          </div>
        ) : null}

        {salida!.que_llevar ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Qué llevar
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-tinta/80">
              {salida!.que_llevar}
            </p>
          </div>
        ) : null}
      </section>

      {/* Participantes confirmados */}
      <section className="mt-6">
        <div className="text-[11px] uppercase tracking-wide text-tinta/40">
          Tripulación confirmada
        </div>
        {confirmados.length === 0 ? (
          <p className="mt-2 text-sm text-tinta/50">
            Todavía no hay confirmados.
          </p>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {confirmadosVisible.map((c) => {
                const p = unwrapProfile(c.profile);
                return (
                  <div
                    key={c.user_id}
                    title={p?.nombre ?? ""}
                    className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-crema bg-rio text-xs font-bold text-crema"
                  >
                    {p?.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_url}
                        alt={p.nombre ?? "Participante"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials(p?.nombre)}</span>
                    )}
                  </div>
                );
              })}
              {confirmadosExtra > 0 ? (
                <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-crema bg-tinta/10 text-xs font-bold text-tinta/70">
                  +{confirmadosExtra}
                </div>
              ) : null}
            </div>
            <span className="text-sm text-tinta/60">
              {confirmados.length}{" "}
              {confirmados.length === 1 ? "confirmado" : "confirmados"}
            </span>
          </div>
        )}
      </section>

      {/* Compartir */}
      <BotonesCompartir {...shareProps} />

      {/* Sección de gestión (placeholder para el host) */}
      {isHost ? (
        <section id="solicitudes" className="mt-8 scroll-mt-20">
          <div className="text-[11px] uppercase tracking-wide text-tinta/40">
            Solicitudes
          </div>
          <div className="mt-2 rounded-2xl border border-dashed border-tinta/15 bg-white/50 p-6 text-center text-sm text-tinta/60">
            Próximamente vas a poder aceptar y rechazar solicitudes desde acá.
          </div>
        </section>
      ) : null}
    </div>
  );
}

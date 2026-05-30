import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORIA_LABEL,
  TRANSPORTE_LABEL,
  formatFechaCorta,
  formatFechaLarga,
  formatPesos,
} from "@/lib/format";
import AutoToast from "@/components/AutoToast";
import MapView from "@/components/map/MapView";
import BotonParticipar from "./BotonParticipar";
import { BotonesCompartir, IconoCompartirHeader } from "./Compartir";
import HostPanel, { type Pendiente } from "./HostPanel";
import ChatTripulacion from "./ChatTripulacion";
import AportesSection from "./AportesSection";

const TOAST_MENSAJES: Record<string, string> = {
  "calificaciones-enviadas": "¡Calificaciones enviadas!",
};

type Costo = { concepto: string; monto: number };

type AporteRow = {
  id: string;
  nombre: string;
  categoria: string;
  asignado_a: string | null;
  profile:
    | { nombre: string | null; foto_url: string | null }
    | { nombre: string | null; foto_url: string | null }[]
    | null;
};

type ConfirmadoRow = {
  user_id: string;
  profile:
    | {
        nombre: string | null;
        foto_url: string | null;
        reputacion_promedio: number | null;
      }
    | {
        nombre: string | null;
        foto_url: string | null;
        reputacion_promedio: number | null;
      }[]
    | null;
};

type PendienteRow = {
  id: string;
  user_id: string;
  mensaje: string | null;
  profile:
    | {
        nombre: string | null;
        foto_url: string | null;
        bio: string | null;
        instagram_handle: string | null;
        reputacion_promedio: number | null;
      }
    | {
        nombre: string | null;
        foto_url: string | null;
        bio: string | null;
        instagram_handle: string | null;
        reputacion_promedio: number | null;
      }[]
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

function unwrap<T>(p: T | T[] | null): T | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default async function SalidaDetallePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nueva?: string; toast?: string };
}) {
  const supabase = createClient();

  const [{ data: salida }, { data: userData }] = await Promise.all([
    supabase
      .from("salidas")
      .select(
        "id, titulo, descripcion, punto_encuentro_texto, punto_encuentro_lat, punto_encuentro_lng, fecha_hora, cupos_total, cupos_ocupados, transporte, categoria, costos, que_llevar, estado, host_id",
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!salida) {
    notFound();
  }

  const user = userData.user ?? null;
  const isHost = user?.id === salida!.host_id;

  // Host del header / card.
  const { data: host } = await supabase
    .from("profiles")
    .select("nombre, foto_url, reputacion_promedio, verificado")
    .eq("id", salida!.host_id)
    .maybeSingle();

  // Estado de participación del usuario actual.
  let estadoParticipacion:
    | "pendiente"
    | "aceptado"
    | "rechazado"
    | null = null;
  if (user && !isHost) {
    const { data: miPart } = await supabase
      .from("participaciones")
      .select("estado")
      .eq("salida_id", salida!.id)
      .eq("user_id", user.id)
      .maybeSingle();
    estadoParticipacion = (miPart?.estado as typeof estadoParticipacion) ?? null;
  }

  // Confirmados (con reputación para mostrar la lista al host también).
  const { data: confirmadosData } = await supabase
    .from("participaciones")
    .select(
      "user_id, profile:profiles!participaciones_user_id_fkey (nombre, foto_url, reputacion_promedio)",
    )
    .eq("salida_id", salida!.id)
    .eq("estado", "aceptado")
    .order("created_at", { ascending: true });

  const confirmadosRows = (confirmadosData ?? []) as unknown as ConfirmadoRow[];
  const confirmados = confirmadosRows.map((r) => {
    const p = unwrap(r.profile);
    return {
      user_id: r.user_id,
      nombre: p?.nombre ?? null,
      foto_url: p?.foto_url ?? null,
      reputacion_promedio: p?.reputacion_promedio ?? null,
    };
  });

  // Solicitudes pendientes (solo cargamos si sos host — la RLS igual te bloquea si no).
  let pendientes: Pendiente[] = [];
  if (isHost) {
    const { data: pendData } = await supabase
      .from("participaciones")
      .select(
        "id, user_id, mensaje, profile:profiles!participaciones_user_id_fkey (nombre, foto_url, bio, instagram_handle, reputacion_promedio)",
      )
      .eq("salida_id", salida!.id)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true });

    const rows = (pendData ?? []) as unknown as PendienteRow[];
    pendientes = rows.map((r) => {
      const p = unwrap(r.profile);
      return {
        id: r.id,
        user_id: r.user_id,
        mensaje: r.mensaje,
        profile: {
          nombre: p?.nombre ?? null,
          foto_url: p?.foto_url ?? null,
          bio: p?.bio ?? null,
          instagram_handle: p?.instagram_handle ?? null,
          reputacion_promedio: p?.reputacion_promedio ?? null,
        },
      };
    });
  }

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
  const cuposCompletos = cuposLibres === 0 || salida!.estado !== "abierta";
  const recienCreada = searchParams.nueva === "1";

  const isFinalizadaOPasada =
    salida!.estado === "finalizada" ||
    new Date(salida!.fecha_hora).getTime() < Date.now();
  const isCancelada = salida!.estado === "cancelada";

  // ¿Puede calificar / ya calificó?
  const usuarioParticipo =
    !!user && (isHost || estadoParticipacion === "aceptado");
  let yaCalifico = false;
  if (user && usuarioParticipo && isFinalizadaOPasada && !isCancelada) {
    const { count } = await supabase
      .from("calificaciones")
      .select("id", { count: "exact", head: true })
      .eq("salida_id", salida!.id)
      .eq("from_user", user.id);
    yaCalifico = (count ?? 0) > 0;
  }
  const puedeCalificar =
    usuarioParticipo && isFinalizadaOPasada && !isCancelada && !yaCalifico;

  // Chat de la tripulación: visible solo para host + participantes aceptados.
  const esMiembro = !!user && (isHost || estadoParticipacion === "aceptado");
  const chatCerrado =
    salida!.estado === "finalizada" || salida!.estado === "cancelada";
  const miembrosChat = esMiembro
    ? [
        {
          user_id: salida!.host_id,
          nombre: host?.nombre ?? null,
          foto_url: host?.foto_url ?? null,
        },
        ...confirmados.map((c) => ({
          user_id: c.user_id,
          nombre: c.nombre,
          foto_url: c.foto_url,
        })),
      ]
    : [];
  let chatMensajes: {
    id: string;
    user_id: string;
    texto: string;
    created_at: string;
  }[] = [];
  if (esMiembro) {
    const { data: msgs } = await supabase
      .from("chat_mensajes")
      .select("id, user_id, texto, created_at")
      .eq("salida_id", salida!.id)
      .order("created_at", { ascending: true })
      .limit(200);
    chatMensajes = (msgs ?? []) as unknown as typeof chatMensajes;
  }

  // Aportes — lista pública de "quién lleva qué".
  const { data: aportesData } = await supabase
    .from("aportes")
    .select(
      "id, nombre, categoria, asignado_a, profile:profiles!aportes_asignado_a_fkey (nombre, foto_url)",
    )
    .eq("salida_id", salida!.id)
    .order("created_at", { ascending: true });

  const aportes = ((aportesData ?? []) as unknown as AporteRow[]).map((a) => {
    const p = unwrap(a.profile);
    return {
      id: a.id,
      nombre: a.nombre,
      categoria: a.categoria,
      asignado_a: a.asignado_a,
      asignadoNombre: p?.nombre ?? null,
      asignadoFoto: p?.foto_url ?? null,
    };
  });

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-arena/15 px-3 py-1 text-xs font-medium text-arena">
            {salida!.estado === "abierta" ? "Abierta" : salida!.estado}
          </span>
          {salida!.categoria ? (
            <span className="inline-flex items-center rounded-full bg-rio/10 px-3 py-1 text-xs font-medium text-rio">
              {CATEGORIA_LABEL[salida!.categoria] ?? salida!.categoria}
            </span>
          ) : null}
        </div>
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
        {isCancelada ? (
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
          >
            Salida cancelada
          </button>
        ) : isFinalizadaOPasada ? (
          puedeCalificar ? (
            <Link
              href={`/salida/${salida!.id}/calificar`}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98]"
            >
              Calificá a la tripulación →
            </Link>
          ) : usuarioParticipo && yaCalifico ? (
            <button
              type="button"
              disabled
              className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
            >
              Ya calificaste esta salida ✓
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
            >
              Salida finalizada
            </button>
          )
        ) : !user ? (
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
            {pendientes.length > 0 ? (
              <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-arena px-1.5 text-[11px] font-bold text-crema">
                {pendientes.length}
              </span>
            ) : null}
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

        {salida!.punto_encuentro_texto ||
        (salida!.punto_encuentro_lat != null &&
          salida!.punto_encuentro_lng != null) ? (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-tinta/40">
              Punto de encuentro
            </div>
            {salida!.punto_encuentro_texto ? (
              <div className="mt-1 text-base font-semibold text-noche">
                {salida!.punto_encuentro_texto}
              </div>
            ) : null}
            {salida!.punto_encuentro_lat != null &&
            salida!.punto_encuentro_lng != null ? (
              <div className="mt-3 space-y-3">
                <MapView
                  lat={salida!.punto_encuentro_lat}
                  lng={salida!.punto_encuentro_lng}
                />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${salida!.punto_encuentro_lat},${salida!.punto_encuentro_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rio/30 bg-rio/5 px-4 text-sm font-semibold text-rio active:scale-[0.98]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 11l19-9-9 19-2-8-8-2z" />
                  </svg>
                  Cómo llegar
                </a>
              </div>
            ) : null}
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

      {/* Stack público de avatares — solo para no-host (host ve lista rica abajo) */}
      {!isHost ? (
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
                {confirmadosVisible.map((c) => (
                  <div
                    key={c.user_id}
                    title={c.nombre ?? ""}
                    className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-crema bg-rio text-xs font-bold text-crema"
                  >
                    {c.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.foto_url}
                        alt={c.nombre ?? "Participante"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials(c.nombre)}</span>
                    )}
                  </div>
                ))}
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
      ) : null}

      {/* Compartir (siempre visible) */}
      <BotonesCompartir {...shareProps} />

      {/* Aportes — lista pública; reclamar solo tripulación */}
      <AportesSection
        salidaId={salida!.id}
        aportes={aportes}
        isHost={isHost}
        esMiembro={esMiembro}
        currentUserId={user?.id ?? null}
      />

      {/* Chat de la tripulación — solo host + aceptados */}
      {esMiembro ? (
        <ChatTripulacion
          salidaId={salida!.id}
          currentUserId={user!.id}
          miembros={miembrosChat}
          initialMensajes={chatMensajes}
          cerrado={chatCerrado}
        />
      ) : null}

      {/* Panel del host */}
      {isHost ? (
        <HostPanel
          salidaId={salida!.id}
          titulo={salida!.titulo}
          fechaTexto={formatFechaCorta(salida!.fecha_hora)}
          punto={salida!.punto_encuentro_texto}
          estadoSalida={salida!.estado}
          pendientes={pendientes}
          confirmados={confirmados}
        />
      ) : null}

      {searchParams.toast && TOAST_MENSAJES[searchParams.toast] ? (
        <AutoToast mensaje={TOAST_MENSAJES[searchParams.toast]} />
      ) : null}
    </div>
  );
}

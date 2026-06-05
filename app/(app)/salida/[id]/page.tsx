import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  categoriaLabel,
  TRANSPORTE_LABEL,
  formatFechaCorta,
  formatFechaLarga,
  formatPesos,
  calcularEdad,
  rangoEdadLabel,
} from "@/lib/format";
import AutoToast from "@/components/AutoToast";
import MapView from "@/components/map/MapView";
import BotonParticipar from "./BotonParticipar";
import DejarSalida from "./DejarSalida";
import { BotonesCompartir, IconoCompartirHeader } from "./Compartir";
import HostPanel, { type Pendiente } from "./HostPanel";
import ChatTripulacion from "./ChatTripulacion";
import AportesSection from "./AportesSection";
import SalidaTabs from "./SalidaTabs";
import GestionarSalida from "./GestionarSalida";
import RangoBadge from "@/components/RangoBadge";
import CuorumBar from "@/components/CuorumBar";
import CierreCountdown from "@/components/CierreCountdown";
import PortadaCover from "@/components/PortadaCover";

const TOAST_MENSAJES: Record<string, string> = {
  "calificaciones-enviadas": "¡Calificaciones enviadas!",
};

const ESTADO_LABEL: Record<string, string> = {
  abierta: "Abierta",
  completa: "Completa",
  cerrada: "Cerrada",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
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
        rango_tripulante: string | null;
      }
    | {
        nombre: string | null;
        foto_url: string | null;
        reputacion_promedio: number | null;
        rango_tripulante: string | null;
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
  searchParams: { nueva?: string; toast?: string; tab?: string };
}) {
  const supabase = createClient();

  const [{ data: salida }, { data: userData }] = await Promise.all([
    supabase
      .from("salidas")
      .select(
        "id, titulo, descripcion, punto_encuentro_texto, punto_encuentro_lat, punto_encuentro_lng, fecha_hora, cierre_inscripcion, cupos_total, cupos_ocupados, participantes_minimos, transporte, categoria, tipo_otro, costos, que_llevar, estado, es_privada, edad_min, edad_max, host_id, imagen_portada",
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
    .select(
      "nombre, foto_url, reputacion_promedio, verificado, es_capitan, rango_host",
    )
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

  // Rango de edad de la salida: ¿el usuario actual queda afuera?
  const tieneRangoEdad =
    salida!.edad_min != null || salida!.edad_max != null;
  const rangoEdadTexto = rangoEdadLabel(salida!.edad_min, salida!.edad_max);
  let fueraDeRangoEdad = false;
  if (user && !isHost && tieneRangoEdad) {
    const { data: miPerfil } = await supabase
      .from("profiles")
      .select("fecha_nacimiento")
      .eq("id", user.id)
      .maybeSingle();
    const edadUsuario = calcularEdad(miPerfil?.fecha_nacimiento);
    fueraDeRangoEdad =
      edadUsuario == null ||
      (salida!.edad_min != null && edadUsuario < salida!.edad_min) ||
      (salida!.edad_max != null && edadUsuario > salida!.edad_max);
  }

  // Confirmados (con reputación para mostrar la lista al host también).
  const { data: confirmadosData } = await supabase
    .from("participaciones")
    .select(
      "user_id, profile:profiles!participaciones_user_id_fkey (nombre, foto_url, reputacion_promedio, rango_tripulante)",
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
      rango_tripulante: p?.rango_tripulante ?? null,
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

  // Cierre de inscripción: cierre_inscripcion ?? fecha_hora.
  const cierreEfectivoISO = salida!.cierre_inscripcion ?? salida!.fecha_hora;
  const inscripcionCerrada =
    new Date(cierreEfectivoISO).getTime() <= Date.now();

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

  // Lecturas del chat (avatares de "visto"): el último mensaje leído por cada
  // miembro. Solo se cargan si sos miembro (la RLS igual te bloquea si no).
  let chatLecturas: { user_id: string; leido_at: string }[] = [];
  if (esMiembro) {
    const { data: lecturas } = await supabase
      .from("chat_lecturas")
      .select("user_id, leido_at")
      .eq("salida_id", salida!.id);
    chatLecturas = (lecturas ?? []) as unknown as typeof chatLecturas;
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

  const aportesSinCubrir = aportes.filter(
    (a) => a.categoria === "repartir" && !a.asignado_a,
  ).length;

  const shareProps = {
    titulo: salida!.titulo,
    fechaTexto: formatFechaCorta(salida!.fecha_hora),
    punto: salida!.punto_encuentro_texto,
    cuposLibres,
  };

  const puedeDejar =
    !isHost &&
    estadoParticipacion === "aceptado" &&
    !isFinalizadaOPasada &&
    !isCancelada;

  // Gestión del host (botón "Gestionar" en el header).
  const estadoActivo =
    salida!.estado === "abierta" || salida!.estado === "completa";
  // Editar: solo mientras la salida sigue en el futuro y abierta.
  const puedeEditar =
    isHost && salida!.estado === "abierta" && !isFinalizadaOPasada && !isCancelada;
  // Finalizar / Cancelar: el host puede mientras la salida siga activa
  // (abierta/completa) y no esté cancelada — INCLUIDA una salida ya vencida.
  // Finalizar es justamente la acción posterior a que la salida ocurrió.
  const puedeFinalizar = isHost && estadoActivo && !isCancelada;
  const puedeCancelar = isHost && estadoActivo && !isCancelada;
  const mostrarGestionar =
    isHost && (puedeEditar || puedeFinalizar || puedeCancelar);

  // ─── Panel "Info" ──────────────────────────────────────────────────────
  const infoPanel = (
    <div className="space-y-3">
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
                <span aria-hidden>📍</span>
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
          <CuorumBar
            aceptados={salida!.cupos_ocupados ?? 0}
            minimo={salida!.participantes_minimos}
            className="mt-2"
          />
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

      {tieneRangoEdad ? (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-wide text-tinta/40">
            Edad
          </div>
          <div className="mt-1 text-base font-semibold text-noche">
            Para personas {rangoEdadTexto}
          </div>
        </div>
      ) : null}

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

      <BotonesCompartir {...shareProps} destacado={salida!.es_privada} />
    </div>
  );

  // ─── Panel "Tripulación" ───────────────────────────────────────────────
  const tripulacionPanel = isHost ? (
    <HostPanel
      salidaId={salida!.id}
      titulo={salida!.titulo}
      fechaTexto={formatFechaCorta(salida!.fecha_hora)}
      punto={salida!.punto_encuentro_texto}
      estadoSalida={salida!.estado}
      pendientes={pendientes}
      confirmados={confirmados}
      aportesSinCubrir={aportesSinCubrir}
    />
  ) : (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
          Tripulación confirmada
        </h2>
        {confirmados.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-6 text-center text-sm text-tinta/60">
            Todavía no hay confirmados. ¡Sumate vos!
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-tinta/5 overflow-hidden rounded-2xl bg-white shadow-sm">
            {confirmados.map((c) => (
              <li key={c.user_id}>
                <Link
                  href={`/perfil/${c.user_id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-crema"
                >
                  <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-rio text-xs font-bold text-crema">
                    {c.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.foto_url}
                        alt={c.nombre ?? "Confirmado"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials(c.nombre)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-noche">
                      {c.nombre ?? "Anónimo"}
                    </div>
                    {c.rango_tripulante ? (
                      <div className="mt-0.5">
                        <RangoBadge rango={c.rango_tripulante} />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-tinta/60">
                    <span className="text-arena">★</span>
                    <span>
                      {Number(c.reputacion_promedio ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <span aria-hidden className="text-tinta/40">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {puedeDejar ? (
        <DejarSalida salidaId={salida!.id} fechaHora={salida!.fecha_hora} />
      ) : null}
    </div>
  );

  // ─── Panel "Aportes" ───────────────────────────────────────────────────
  const aportesPanel = (
    <AportesSection
      salidaId={salida!.id}
      aportes={aportes}
      isHost={isHost}
      esMiembro={esMiembro}
      currentUserId={user?.id ?? null}
    />
  );

  // ─── Panel "Chat" ──────────────────────────────────────────────────────
  const chatPanel = esMiembro ? (
    <ChatTripulacion
      salidaId={salida!.id}
      currentUserId={user!.id}
      miembros={miembrosChat}
      initialMensajes={chatMensajes}
      initialLecturas={chatLecturas}
      cerrado={chatCerrado}
    />
  ) : (
    <div className="rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rio/10 text-xl">
        💬
      </div>
      <p className="mt-3 text-sm font-medium text-noche">
        El chat es de la tripulación
      </p>
      <p className="mt-1 text-sm text-tinta/60">
        Sumate a la salida para charlar con el grupo.
      </p>
    </div>
  );

  return (
    <div className="px-6 pt-6 pb-10">
      <div className="flex items-center justify-between">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver al feed
        </Link>
        <div className="flex items-center gap-2">
          {mostrarGestionar ? (
            <GestionarSalida
              salidaId={salida!.id}
              puedeEditar={puedeEditar}
              puedeFinalizar={puedeFinalizar}
              puedeCancelar={puedeCancelar}
            />
          ) : null}
          <IconoCompartirHeader {...shareProps} />
        </div>
      </div>

      {recienCreada ? (
        <div className="mt-4 rounded-2xl bg-rio/10 px-4 py-3 text-sm font-medium text-rio">
          ✅ Salida publicada. Compartila con tu gente.
        </div>
      ) : null}

      {/* ─── Portada (banner del header, antes del título) ─── */}
      <div className="-mx-6 mt-5 aspect-[16/9] w-[calc(100%+3rem)] overflow-hidden sm:rounded-2xl">
        <PortadaCover
          imagenPortada={salida!.imagen_portada}
          categoria={salida!.categoria}
          tipoOtro={salida!.tipo_otro}
          titulo={salida!.titulo}
          iconClassName="text-7xl"
        />
      </div>

      {/* ─── Header: título, host, estado ─── */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-arena/15 px-3 py-1 text-xs font-medium text-arena">
            {ESTADO_LABEL[salida!.estado] ?? salida!.estado}
          </span>
          {salida!.categoria ? (
            <span className="inline-flex items-center rounded-full bg-rio/10 px-3 py-1 text-xs font-medium text-rio">
              {categoriaLabel(salida!.categoria, salida!.tipo_otro)}
            </span>
          ) : null}
          {salida!.es_privada ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-noche/10 px-3 py-1 text-xs font-medium text-noche">
              🔒 Privada
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
              <RangoBadge rango={host.rango_host} />
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

      {/* CTA principal (invitados / estados finales). El host gestiona en la tab Tripulación. */}
      {isCancelada ? (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
          >
            Salida cancelada
          </button>
        </div>
      ) : isFinalizadaOPasada ? (
        <div className="mt-6">
          {puedeCalificar ? (
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
          )}
        </div>
      ) : isHost ? null : !user ? (
        <div className="mt-6">
          <Link
            href={`/registro?redirect=${encodeURIComponent(`/salida/${salida!.id}`)}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98]"
          >
            Sumate a la tripulación
          </Link>
        </div>
      ) : inscripcionCerrada && !estadoParticipacion ? (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
          >
            Inscripción cerrada
          </button>
        </div>
      ) : fueraDeRangoEdad && !estadoParticipacion ? (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-5 text-center text-sm font-semibold text-tinta/50"
          >
            Esta salida es para personas {rangoEdadTexto}.
          </button>
        </div>
      ) : cuposCompletos && !estadoParticipacion ? (
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="inline-flex h-12 w-full cursor-default items-center justify-center rounded-2xl bg-tinta/10 px-6 text-base font-semibold text-tinta/50"
          >
            Cupos completos
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <BotonParticipar
            salidaId={salida!.id}
            estadoInicial={estadoParticipacion}
          />
        </div>
      )}

      {/* Cuenta regresiva del cierre de inscripción (salida activa) */}
      {!isFinalizadaOPasada && !isCancelada ? (
        <CierreCountdown
          cierre={cierreEfectivoISO}
          className="mt-3 w-full justify-center text-sm font-medium"
        />
      ) : null}

      {/* ─── Tabs ─── */}
      <SalidaTabs
        info={infoPanel}
        tripulacion={tripulacionPanel}
        aportes={aportesPanel}
        chat={chatPanel}
        pendientesCount={isHost ? pendientes.length : 0}
        initialTab={searchParams.tab === "chat" && esMiembro ? "chat" : "info"}
      />

      {searchParams.toast && TOAST_MENSAJES[searchParams.toast] ? (
        <AutoToast mensaje={TOAST_MENSAJES[searchParams.toast]} />
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Toast from "@/components/Toast";
import RangoBadge from "@/components/RangoBadge";
import {
  aceptarSolicitudAction,
  cancelarSalidaAction,
  finalizarSalidaAction,
  rechazarSolicitudAction,
} from "./actions";

type Perfil = {
  nombre: string | null;
  foto_url: string | null;
  bio: string | null;
  instagram_handle: string | null;
  reputacion_promedio: number | null;
};

type ConfirmadoMin = {
  user_id: string;
  nombre: string | null;
  foto_url: string | null;
  reputacion_promedio: number | null;
  rango_tripulante: string | null;
};

export type Pendiente = {
  id: string;
  user_id: string;
  mensaje: string | null;
  profile: Perfil;
};

type Props = {
  salidaId: string;
  titulo: string;
  fechaTexto: string;
  punto: string | null;
  estadoSalida: string;
  pendientes: Pendiente[];
  confirmados: ConfirmadoMin[];
  aportesSinCubrir: number;
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

function recortarBio(bio: string | null) {
  if (!bio) return null;
  const t = bio.trim();
  if (t.length <= 80) return t;
  return `${t.slice(0, 77)}…`;
}

export default function HostPanel({
  salidaId,
  titulo,
  fechaTexto,
  punto,
  estadoSalida,
  pendientes,
  confirmados,
  aportesSinCubrir,
}: Props) {
  const avisoAportes =
    aportesSinCubrir > 0
      ? `Hay ${aportesSinCubrir} ${aportesSinCubrir === 1 ? "aporte sin cubrir" : "aportes sin cubrir"}. Recordá coordinarlo con tu tripulación.`
      : null;
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [cancelAbierto, setCancelAbierto] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState<string>("");
  const [finalizando, setFinalizando] = useState(false);
  const [toast, setToast] = useState<
    { msg: string; tipo: "info" | "error" } | null
  >(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const puedeFinalizar = estadoSalida === "abierta" || estadoSalida === "completa";
  const puedeCancelar = estadoSalida === "abierta" || estadoSalida === "completa";

  function finalizarSalida() {
    if (typeof window === "undefined") return;
    const pregunta = avisoAportes
      ? `¿Marcar la salida como finalizada? Vas a poder calificar a la tripulación.\n\n${avisoAportes}`
      : "¿Marcar la salida como finalizada? Vas a poder calificar a la tripulación.";
    if (!window.confirm(pregunta)) {
      return;
    }
    setFinalizando(true);
    startTransition(async () => {
      const r = await finalizarSalidaAction(salidaId);
      setFinalizando(false);
      if ("error" in r) showToast(r.error, "error");
      else {
        showToast("Salida finalizada ✓");
        // Garantiza que el badge ("Finalizada") y la tab se actualicen sin
        // recarga manual, además del revalidatePath del Server Action.
        router.refresh();
      }
    });
  }

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function aceptar(p: Pendiente) {
    setProcesandoId(p.id);
    startTransition(async () => {
      const r = await aceptarSolicitudAction(p.id, salidaId);
      setProcesandoId(null);
      if ("error" in r) showToast(r.error, "error");
      else showToast("Solicitud aceptada ✓");
    });
  }

  function rechazar(p: Pendiente) {
    setProcesandoId(p.id);
    startTransition(async () => {
      const r = await rechazarSolicitudAction(p.id, salidaId);
      setProcesandoId(null);
      if ("error" in r) showToast(r.error, "error");
      else showToast("Solicitud rechazada");
    });
  }

  function mensajeGrupo() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const piezas = [
      `¡Hola tripulación! Confirmados para ${titulo} el ${fechaTexto}`,
    ];
    if (punto) piezas.push(`en ${punto}`);
    const text = `${piezas.join(" ")}. ¡Los espero ahí! ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function confirmarCancelacion() {
    if (!cancelMotivo) {
      showToast("Elegí un motivo.", "error");
      return;
    }
    setCancelando(true);
    startTransition(async () => {
      try {
        await cancelarSalidaAction(salidaId, cancelMotivo);
      } catch {
        // NEXT_REDIRECT relanza; cualquier otro error no debería ocurrir.
        setCancelando(false);
        showToast("No pudimos cancelar la salida.", "error");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* ─── Pendientes ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
          Solicitudes pendientes
        </h2>

        {pendientes.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-6 text-center text-sm text-tinta/60">
            No tenés solicitudes pendientes.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pendientes.map((p) => {
              const prof = p.profile;
              const procesando = procesandoId === p.id;
              const bio = recortarBio(prof?.bio ?? null);
              return (
                <li
                  key={p.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-sm font-bold text-crema">
                      {prof?.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prof.foto_url}
                          alt={prof.nombre ?? "Solicitante"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initials(prof?.nombre)}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-noche">
                          {prof?.nombre ?? "Anónimo"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs text-tinta/60">
                          <span className="text-arena">★</span>
                          <span>
                            {Number(prof?.reputacion_promedio ?? 0).toFixed(1)}
                          </span>
                        </span>
                      </div>

                      {prof?.instagram_handle ? (
                        <a
                          href={`https://instagram.com/${prof.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-rio"
                        >
                          @{prof.instagram_handle}
                        </a>
                      ) : null}

                      {bio ? (
                        <p className="mt-1 text-xs leading-relaxed text-tinta/70">
                          {bio}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {p.mensaje ? (
                    <blockquote className="mt-3 rounded-xl border-l-4 border-rio/40 bg-rio/5 px-3 py-2 text-sm italic leading-relaxed text-tinta/80">
                      “{p.mensaje}”
                    </blockquote>
                  ) : (
                    <p className="mt-3 text-xs italic text-tinta/40">
                      Sin presentación
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => rechazar(p)}
                      disabled={procesando}
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-50"
                    >
                      Rechazar ✗
                    </button>
                    <button
                      type="button"
                      onClick={() => aceptar(p)}
                      disabled={procesando}
                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-50"
                    >
                      Aceptar ✓
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── Confirmados (vista host con WA grupo) ──────────────────── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
          Tripulación confirmada
        </h2>

        {confirmados.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-6 text-center text-sm text-tinta/60">
            Aceptá a alguien para empezar tu tripulación.
          </p>
        ) : (
          <>
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

            <button
              type="button"
              onClick={mensajeGrupo}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-crema active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M12.04 2C6.58 2 2.14 6.44 2.14 11.9c0 2.09.55 4.08 1.6 5.86L2 22l4.39-1.15a9.86 9.86 0 0 0 5.65 1.78h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.05a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-2.6.68.69-2.54-.19-.32a8.13 8.13 0 0 1-1.26-4.36c0-4.51 3.68-8.18 8.19-8.18s8.18 3.67 8.18 8.18-3.67 8.18-8.18 8.18zm4.49-6.13c-.25-.12-1.45-.71-1.68-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.24a7.49 7.49 0 0 1-1.38-1.72c-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.41.06-.63.31s-.83.81-.83 1.98c0 1.17.85 2.3.97 2.46.12.16 1.67 2.55 4.05 3.58.57.25 1.01.4 1.36.51.57.18 1.09.16 1.5.1.46-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
              </svg>
              Mensaje de WhatsApp para el grupo
            </button>
          </>
        )}
      </section>

      {/* ─── Zona de peligro ─────────────────────────────────────────── */}
      {(puedeFinalizar || puedeCancelar) ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-arena">
            Zona de peligro
          </h2>
          <div className="mt-3 space-y-3 rounded-2xl border border-arena/30 bg-white p-4 shadow-sm">
            {puedeFinalizar ? (
              <>
                <p className="text-sm text-tinta/70">
                  Cuando vuelvan del río, marcala como finalizada para que la
                  tripulación pueda calificarse.
                </p>
                {avisoAportes ? (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-200">
                    {avisoAportes}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={finalizarSalida}
                  disabled={finalizando}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-rio px-4 text-sm font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98] disabled:opacity-60"
                >
                  {finalizando ? "Finalizando…" : "Finalizar salida"}
                </button>
              </>
            ) : null}

            {puedeCancelar ? (
              <>
                <p className="text-sm text-tinta/70">
                  Si la salida ya no va, cancelala. La gente confirmada queda avisada.
                </p>
                <button
                  type="button"
                  onClick={() => setCancelAbierto(true)}
                  disabled={cancelando}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-arena bg-crema px-4 text-sm font-semibold text-arena active:scale-[0.98] disabled:opacity-60"
                >
                  {cancelando ? "Cancelando…" : "Cancelar salida"}
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Modal: cancelar salida con motivo */}
      {cancelAbierto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-noche/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-noche">¿Cancelar la salida?</h3>
            <p className="mt-1 text-sm text-tinta/60">
              Contanos el motivo. La tripulación queda avisada.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { value: "fuerza_mayor", label: "Clima / emergencia / fuerza mayor" },
                {
                  value: "cuorum_no_alcanzado",
                  label: "No llegamos al mínimo de participantes",
                },
                { value: "personal", label: "Motivo personal" },
              ].map((m) => {
                const active = cancelMotivo === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCancelMotivo(m.value)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "border-rio bg-rio/10 text-noche"
                        : "border-tinta/15 bg-white text-tinta/80"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        active ? "border-rio bg-rio text-crema" : "border-tinta/25"
                      }`}
                    >
                      {active ? "✓" : ""}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {cancelMotivo === "personal" ? (
              <p className="mt-3 text-xs text-arena">
                Si faltan 48hs o menos, se registra una cancelación de último
                momento en tu perfil.
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelAbierto(false)}
                disabled={cancelando}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-4 text-sm font-semibold text-tinta/70 active:scale-[0.98] disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarCancelacion}
                disabled={cancelando || !cancelMotivo}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-arena px-4 text-sm font-semibold text-crema active:scale-[0.98] disabled:opacity-50"
              >
                {cancelando ? "Cancelando…" : "Cancelar salida"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </div>
  );
}

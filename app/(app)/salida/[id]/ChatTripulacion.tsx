"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enviarMensajeChatAction } from "./actions";

type Mensaje = {
  id: string;
  user_id: string;
  texto: string;
  created_at: string;
};

type Miembro = {
  user_id: string;
  nombre: string | null;
  foto_url: string | null;
};

type Lectura = {
  user_id: string;
  leido_at: string;
};

type Props = {
  salidaId: string;
  currentUserId: string;
  miembros: Miembro[];
  initialMensajes: Mensaje[];
  initialLecturas: Lectura[];
  cerrado: boolean;
};

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const MAX = 1000;

export default function ChatTripulacion({
  salidaId,
  currentUserId,
  miembros,
  initialMensajes,
  initialLecturas,
  cerrado,
}: Props) {
  const [supabase] = useState(() => createClient());
  const [mensajes, setMensajes] = useState<Mensaje[]>(initialMensajes);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Mapa user_id → leido_at (ISO) de toda la tripulación, para los avatares de
  // "visto". Se mantiene en vivo con realtime sobre chat_lecturas.
  const [lecturas, setLecturas] = useState<Map<string, string>>(
    () => new Map(initialLecturas.map((l) => [l.user_id, l.leido_at])),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const visibleRef = useRef(false);
  const miembroMap = useRef(
    new Map(miembros.map((m): [string, Miembro] => [m.user_id, m])),
  ).current;
  // Nombre de canal único por instancia: si el mismo usuario abre dos pestañas
  // no comparten canal (evita choques de suscripción / duplicados).
  const channelName = useRef(
    `chat-${salidaId}-${
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    }`,
  ).current;

  // Marca como leído el último mensaje visible (upsert por salida+usuario).
  // Avanza también el mapa local para mi propia marca al instante.
  const marcarLeido = useCallback(async () => {
    const ultimo = mensajes[mensajes.length - 1];
    if (!ultimo) return;
    const ahora = new Date().toISOString();
    setLecturas((prev) => {
      const next = new Map(prev);
      next.set(currentUserId, ahora);
      return next;
    });
    await supabase.from("chat_lecturas").upsert(
      {
        salida_id: salidaId,
        user_id: currentUserId,
        mensaje_id: ultimo.id,
        leido_at: ahora,
      },
      { onConflict: "salida_id,user_id" },
    );
  }, [supabase, salidaId, currentUserId, mensajes]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_mensajes",
          filter: `salida_id=eq.${salidaId}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje;
          setMensajes((prev) =>
            prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_lecturas",
          filter: `salida_id=eq.${salidaId}`,
        },
        (payload) => {
          const row = payload.new as Lectura | null;
          if (!row?.user_id) return;
          setLecturas((prev) => {
            const next = new Map(prev);
            next.set(row.user_id, row.leido_at);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, salidaId, channelName]);

  // Visibilidad real del panel (las tabs lo ocultan con display:none, así que
  // IntersectionObserver lo reporta no-visible cuando no está en la tab Chat).
  // Al volverse visible, marcamos leído.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        visibleRef.current = visible;
        if (visible) void marcarLeido();
      },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [marcarLeido]);

  // Mensajes nuevos mientras estoy mirando → marcar leído (y scrollear).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (visibleRef.current) void marcarLeido();
  }, [mensajes.length, marcarLeido]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando || cerrado) return;
    setEnviando(true);
    const r = await enviarMensajeChatAction(salidaId, t.slice(0, MAX));
    setEnviando(false);
    if ("ok" in r) {
      setTexto("");
      const msg = r.mensaje;
      setMensajes((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    }
  }

  // Índice del último mensaje propio: debajo de él van los avatares de "visto".
  let lastOwnIndex = -1;
  for (let i = mensajes.length - 1; i >= 0; i--) {
    if (mensajes[i].user_id === currentUserId) {
      lastOwnIndex = i;
      break;
    }
  }

  // Otros miembros de la tripulación (sin contarme a mí).
  const otros = miembros.filter((m) => m.user_id !== currentUserId);

  function lectoresDe(mensaje: Mensaje): Miembro[] {
    const t = new Date(mensaje.created_at).getTime();
    return otros.filter((m) => {
      const leidoAt = lecturas.get(m.user_id);
      return leidoAt != null && new Date(leidoAt).getTime() >= t;
    });
  }

  return (
    <section ref={rootRef}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
        Chat de la tripulación
      </h2>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {mensajes.length === 0 ? (
            <p className="py-8 text-center text-sm text-tinta/50">
              Todavía no hay mensajes. Rompé el hielo 👋
            </p>
          ) : (
            mensajes.map((m, idx) => {
              const autor = miembroMap.get(m.user_id);
              const mio = m.user_id === currentUserId;
              const lectores =
                idx === lastOwnIndex ? lectoresDe(m) : [];
              const vistoPorTodos =
                otros.length > 0 && lectores.length === otros.length;
              return (
                <div key={m.id}>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-[11px] font-bold text-crema">
                      {autor?.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={autor.foto_url}
                          alt={autor.nombre ?? "Miembro"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{initials(autor?.nombre)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold text-noche">
                          {mio ? "Vos" : autor?.nombre ?? "Miembro"}
                        </span>
                        <span className="shrink-0 text-[11px] text-tinta/40">
                          {formatHora(m.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-tinta/80">
                        {m.texto}
                      </p>
                    </div>
                  </div>

                  {/* "Visto por" — debajo del último mensaje propio */}
                  {idx === lastOwnIndex && lectores.length > 0 ? (
                    <div className="mt-1.5 flex items-center justify-end gap-1.5 pr-1">
                      {vistoPorTodos ? (
                        <span className="text-[11px] font-medium text-rio">
                          ✓ Visto por todos
                        </span>
                      ) : (
                        <span className="text-[11px] text-tinta/40">Visto por</span>
                      )}
                      <div className="flex -space-x-1.5">
                        {lectores.map((l) => (
                          <div
                            key={l.user_id}
                            title={l.nombre ?? "Miembro"}
                            className="grid h-5 w-5 place-items-center overflow-hidden rounded-full bg-rio text-[8px] font-bold text-crema ring-2 ring-white"
                          >
                            {l.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={l.foto_url}
                                alt={l.nombre ?? "Miembro"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initials(l.nombre)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {cerrado ? (
          <p className="mt-4 rounded-xl bg-tinta/5 px-4 py-3 text-center text-sm text-tinta/50">
            Este chat está cerrado.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-4 flex items-center gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={MAX}
              placeholder="Escribí un mensaje…"
              className="min-w-0 flex-1 rounded-2xl border border-tinta/15 bg-crema px-4 py-2.5 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-rio px-4 text-sm font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98] disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

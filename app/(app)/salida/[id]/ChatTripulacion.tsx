"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

type Props = {
  salidaId: string;
  currentUserId: string;
  miembros: Miembro[];
  initialMensajes: Mensaje[];
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
  cerrado,
}: Props) {
  const [supabase] = useState(() => createClient());
  const [mensajes, setMensajes] = useState<Mensaje[]>(initialMensajes);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const miembroMap = useRef(
    new Map(miembros.map((m): [string, Miembro] => [m.user_id, m])),
  ).current;

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${salidaId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, salidaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando || cerrado) return;
    setEnviando(true);
    const { data, error } = await supabase
      .from("chat_mensajes")
      .insert({ salida_id: salidaId, user_id: currentUserId, texto: t.slice(0, MAX) })
      .select("id, user_id, texto, created_at")
      .single();
    setEnviando(false);
    if (!error && data) {
      setTexto("");
      const msg = data as Mensaje;
      setMensajes((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    }
  }

  return (
    <section className="mt-10">
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
            mensajes.map((m) => {
              const autor = miembroMap.get(m.user_id);
              const mio = m.user_id === currentUserId;
              return (
                <div key={m.id} className="flex items-start gap-2.5">
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

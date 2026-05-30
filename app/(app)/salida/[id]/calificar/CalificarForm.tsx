"use client";

import { useState, useTransition } from "react";
import Toast from "@/components/Toast";
import { calificarAction } from "./actions";

export type Persona = {
  id: string;
  nombre: string | null;
  foto_url: string | null;
  rol: "host" | "invitado";
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

function Estrellas({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Puntaje">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            aria-checked={value === n}
            role="radio"
            className="p-1"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-8 w-8 ${active ? "fill-arena" : "fill-tinta/15"}`}
              aria-hidden
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function CalificarForm({
  salidaId,
  personas,
}: {
  salidaId: string;
  personas: Persona[];
}) {
  const [puntajes, setPuntajes] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setPuntaje(id: string, n: number) {
    setPuntajes((prev) => ({ ...prev, [id]: n }));
  }
  function setComentario(id: string, txt: string) {
    setComentarios((prev) => ({ ...prev, [id]: txt.slice(0, 200) }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const total = Object.values(puntajes).filter((v) => v > 0).length;
    if (total === 0) {
      setError("Calificá al menos a una persona.");
      return;
    }

    const fd = new FormData();
    for (const persona of personas) {
      const p = puntajes[persona.id] ?? 0;
      if (p < 1) continue;
      fd.set(`puntaje_${persona.id}`, String(p));
      fd.set(`comentario_${persona.id}`, comentarios[persona.id] ?? "");
    }

    startTransition(async () => {
      const r = await calificarAction(salidaId, fd);
      if (r && "error" in r) {
        setError(r.error);
      }
    });
  }

  if (personas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-tinta/15 bg-white/50 p-6 text-center text-sm text-tinta/60">
        No hay nadie a quien calificar en esta salida.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {personas.map((persona) => {
        const valor = puntajes[persona.id] ?? 0;
        const comentario = comentarios[persona.id] ?? "";
        return (
          <div
            key={persona.id}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-sm font-bold text-crema">
                {persona.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={persona.foto_url}
                    alt={persona.nombre ?? "Persona"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials(persona.nombre)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-noche">
                  {persona.nombre ?? "Anónimo"}
                </div>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    persona.rol === "host"
                      ? "bg-rio/15 text-rio"
                      : "bg-tinta/10 text-tinta/60"
                  }`}
                >
                  {persona.rol === "host" ? "Host" : "Tripulación"}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <Estrellas
                value={valor}
                onChange={(n) => setPuntaje(persona.id, n)}
              />
            </div>

            <div className="mt-3">
              <label
                htmlFor={`comentario_${persona.id}`}
                className="sr-only"
              >
                Comentario sobre {persona.nombre ?? "esta persona"}
              </label>
              <textarea
                id={`comentario_${persona.id}`}
                value={comentario}
                onChange={(e) => setComentario(persona.id, e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Dejá una referencia (opcional)"
                className="block w-full resize-none rounded-xl border border-tinta/15 bg-crema px-3 py-2 text-sm outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
              <div className="mt-1 text-right text-[10px] text-tinta/40">
                {comentario.length}/200
              </div>
            </div>
          </div>
        );
      })}

      {error ? (
        <div role="alert" className="rounded-2xl bg-arena/15 px-4 py-3 text-sm text-arena">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar calificaciones"}
      </button>

      {pending ? <Toast mensaje="Enviando calificaciones…" /> : null}
    </form>
  );
}

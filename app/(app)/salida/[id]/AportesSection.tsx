"use client";

import { useState, useTransition } from "react";
import Toast from "@/components/Toast";
import {
  agregarAporte,
  borrarAporte,
  reclamarAporte,
  soltarAporte,
} from "./aportes";

export type Aporte = {
  id: string;
  nombre: string;
  categoria: string;
  asignado_a: string | null;
  asignadoNombre: string | null;
  asignadoFoto: string | null;
};

type Props = {
  salidaId: string;
  aportes: Aporte[];
  isHost: boolean;
  esMiembro: boolean;
  currentUserId: string | null;
};

const BLOQUES = [
  {
    cat: "host",
    titulo: "Lo que pone el host",
    vacio: "El host todavía no cargó nada.",
  },
  {
    cat: "repartir",
    titulo: "Por repartir",
    vacio: "Nada para repartir por ahora.",
  },
  {
    cat: "cada_uno",
    titulo: "Cada uno trae lo suyo",
    vacio: "Sin recordatorios por ahora.",
  },
];

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AportesSection({
  salidaId,
  aportes,
  isHost,
  esMiembro,
  currentUserId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    msg: string;
    tipo: "info" | "error";
  } | null>(null);
  const [nombre, setNombre] = useState("");
  const [cat, setCat] = useState("repartir");

  function showToast(msg: string, tipo: "info" | "error" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function run(fn: () => Promise<{ ok: true } | { error: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (r && "error" in r) showToast(r.error, "error");
    });
  }

  function onAgregar(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n || isPending) return;
    startTransition(async () => {
      const r = await agregarAporte(salidaId, n, cat);
      if (r && "error" in r) showToast(r.error, "error");
      else setNombre("");
    });
  }

  const porCat = (c: string) => aportes.filter((a) => a.categoria === c);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
        Aportes
      </h2>
      <p className="mt-1 text-sm text-tinta/60">Quién lleva qué.</p>

      {isHost ? (
        <form onSubmit={onAgregar} className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={120}
            placeholder="Ej: Hielo, carbón, ensalada…"
            className="block w-full rounded-2xl border border-tinta/15 bg-crema px-4 py-2.5 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
          <div className="mt-2 flex items-center gap-2">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="flex-1 rounded-2xl border border-tinta/15 bg-crema px-3 py-2.5 text-sm text-tinta/80 outline-none focus:border-rio"
            >
              <option value="host">Lo pone el host</option>
              <option value="repartir">Por repartir</option>
              <option value="cada_uno">Cada uno lo suyo</option>
            </select>
            <button
              type="submit"
              disabled={!nombre.trim() || isPending}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-rio px-4 text-sm font-semibold text-crema shadow-sm shadow-rio/20 active:scale-[0.98] disabled:opacity-40"
            >
              Agregar
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 space-y-5">
        {BLOQUES.map((b) => {
          const items = porCat(b.cat);
          if (items.length === 0 && !isHost) return null;
          return (
            <div key={b.cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-tinta/40">
                {b.titulo}
              </h3>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-tinta/40">{b.vacio}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {items.map((a) => {
                    const mio = !!currentUserId && a.asignado_a === currentUserId;
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-noche">
                          {a.nombre}
                        </span>

                        {b.cat === "repartir" ? (
                          a.asignado_a ? (
                            <span className="flex shrink-0 items-center gap-1.5">
                              <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-rio text-[10px] font-bold text-crema">
                                {a.asignadoFoto ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={a.asignadoFoto}
                                    alt={a.asignadoNombre ?? "Miembro"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span>{initials(a.asignadoNombre)}</span>
                                )}
                              </span>
                              <span className="text-xs font-medium text-tinta/60">
                                {mio ? "Vos" : a.asignadoNombre ?? "Reservado"}
                              </span>
                              {mio ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    run(() => soltarAporte(a.id, salidaId))
                                  }
                                  className="ml-1 rounded-full px-2 py-1 text-xs font-semibold text-arena disabled:opacity-40"
                                >
                                  Ya no puedo
                                </button>
                              ) : null}
                            </span>
                          ) : (
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-200">
                                Sin cubrir
                              </span>
                              {esMiembro ? (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    run(() => reclamarAporte(a.id, salidaId))
                                  }
                                  className="rounded-full bg-rio/10 px-3 py-1.5 text-xs font-semibold text-rio disabled:opacity-40"
                                >
                                  Yo lo llevo
                                </button>
                              ) : null}
                            </span>
                          )
                        ) : null}

                        {isHost ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => borrarAporte(a.id, salidaId))}
                            aria-label="Borrar aporte"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-tinta/40 hover:text-arena disabled:opacity-40"
                          >
                            ×
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {toast ? <Toast mensaje={toast.msg} tipo={toast.tipo} /> : null}
    </section>
  );
}

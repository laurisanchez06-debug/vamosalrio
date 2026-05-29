"use client";

import { useMemo, useState, useTransition } from "react";
import { createSalidaAction } from "./actions";

type CostoRow = { id: string; concepto: string; monto: string };

const TRANSPORTES = [
  { value: "lancha_publica", label: "Lancha pública" },
  { value: "lancha_privada", label: "Lancha privada" },
  { value: "lancha_taxi", label: "Lancha taxi" },
  { value: "kayak", label: "Kayak" },
  { value: "a_pie", label: "A pie" },
  { value: "otro", label: "Otro" },
] as const;

const MAX_DESC = 500;

function nuevoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function formatPesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function NuevaSalidaForm() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntoEncuentro, setPuntoEncuentro] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [cupos, setCupos] = useState(4);
  const [transporte, setTransporte] = useState<string>("");
  const [costos, setCostos] = useState<CostoRow[]>([]);
  const [queLlevar, setQueLlevar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = useMemo(
    () => costos.reduce((s, c) => s + (Number(c.monto) || 0), 0),
    [costos],
  );
  const porPersona = cupos > 0 ? Math.ceil(total / cupos) : 0;

  function addCosto() {
    setCostos((arr) => [
      ...arr,
      { id: nuevoId(), concepto: "", monto: "" },
    ]);
  }

  function updateCosto(id: string, patch: Partial<CostoRow>) {
    setCostos((arr) =>
      arr.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  }

  function removeCosto(id: string) {
    setCostos((arr) => arr.filter((c) => c.id !== id));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!fechaHora) {
      setError("Elegí fecha y hora.");
      return;
    }
    if (!transporte) {
      setError("Elegí cómo se llega.");
      return;
    }

    const fecha = new Date(fechaHora);
    if (Number.isNaN(fecha.getTime())) {
      setError("La fecha no es válida.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("fecha_hora_iso", fecha.toISOString());
    fd.set(
      "costos_json",
      JSON.stringify(
        costos
          .map((c) => ({
            concepto: c.concepto.trim(),
            monto: Number(c.monto) || 0,
          }))
          .filter((c) => c.concepto || c.monto > 0),
      ),
    );

    startTransition(async () => {
      const result = await createSalidaAction(fd);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 px-6 pt-6">
      {/* Título */}
      <div>
        <label
          htmlFor="titulo"
          className="mb-1 block text-sm font-medium text-noche"
        >
          Título <span className="text-arena">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          placeholder='Ej: "Domingo en Charigüé"'
          className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
      </div>

      {/* Descripción */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-noche"
          >
            Descripción
          </label>
          <span
            className={`text-xs ${
              descripcion.length > MAX_DESC - 50
                ? "text-arena"
                : "text-tinta/40"
            }`}
          >
            {descripcion.length}/{MAX_DESC}
          </span>
        </div>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={MAX_DESC}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Contale a la tripulación de qué va la salida"
          className="block w-full resize-none rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
      </div>

      {/* Punto de encuentro */}
      <div>
        <label
          htmlFor="punto_encuentro_texto"
          className="mb-1 block text-sm font-medium text-noche"
        >
          Punto de encuentro
        </label>
        <input
          id="punto_encuentro_texto"
          name="punto_encuentro_texto"
          type="text"
          value={puntoEncuentro}
          onChange={(e) => setPuntoEncuentro(e.target.value)}
          placeholder='Ej: "Bajada Sargento Cabral"'
          className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
      </div>

      {/* Fecha + hora */}
      <div>
        <label
          htmlFor="fecha_hora"
          className="mb-1 block text-sm font-medium text-noche"
        >
          Fecha y hora <span className="text-arena">*</span>
        </label>
        <input
          id="fecha_hora"
          name="fecha_hora"
          type="datetime-local"
          required
          value={fechaHora}
          onChange={(e) => setFechaHora(e.target.value)}
          className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
      </div>

      {/* Cupos */}
      <div>
        <label className="mb-1 block text-sm font-medium text-noche">
          Cupos <span className="text-arena">*</span>
        </label>
        <div className="flex items-center justify-between rounded-2xl border border-tinta/15 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setCupos((c) => Math.max(2, c - 1))}
            disabled={cupos <= 2}
            className="grid h-10 w-10 place-items-center rounded-full bg-crema text-xl font-semibold text-noche disabled:opacity-40"
            aria-label="Quitar un cupo"
          >
            −
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-noche">{cupos}</div>
            <div className="text-[11px] uppercase tracking-wide text-tinta/50">
              personas
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCupos((c) => Math.min(20, c + 1))}
            disabled={cupos >= 20}
            className="grid h-10 w-10 place-items-center rounded-full bg-rio text-xl font-semibold text-crema disabled:opacity-40"
            aria-label="Agregar un cupo"
          >
            +
          </button>
        </div>
        <input type="hidden" name="cupos_total" value={cupos} />
      </div>

      {/* Transporte */}
      <div>
        <span className="mb-2 block text-sm font-medium text-noche">
          Transporte <span className="text-arena">*</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {TRANSPORTES.map((opt) => {
            const active = transporte === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTransporte(opt.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-rio bg-rio text-crema"
                    : "border-tinta/15 bg-white text-tinta/80"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="transporte" value={transporte} />
      </div>

      {/* Costos compartidos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-noche">
            Costos compartidos
          </span>
          <button
            type="button"
            onClick={addCosto}
            className="text-sm font-semibold text-rio"
          >
            + Agregar costo
          </button>
        </div>

        {costos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-tinta/15 bg-crema px-4 py-3 text-sm text-tinta/50">
            Sin costos compartidos. Si hay nafta, lancha o algo a dividir, sumalo.
          </p>
        ) : (
          <div className="space-y-2">
            {costos.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-2xl border border-tinta/15 bg-white px-3 py-2"
              >
                <input
                  type="text"
                  placeholder="Concepto"
                  value={c.concepto}
                  onChange={(e) =>
                    updateCosto(c.id, { concepto: e.target.value })
                  }
                  className="flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                />
                <div className="flex items-center gap-1 text-sm text-tinta/50">
                  <span>$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    inputMode="numeric"
                    placeholder="0"
                    value={c.monto}
                    onChange={(e) =>
                      updateCosto(c.id, { monto: e.target.value })
                    }
                    className="w-24 bg-transparent py-2 text-right text-sm text-tinta outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCosto(c.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-arena"
                  aria-label="Quitar costo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {costos.length > 0 ? (
          <p className="mt-3 text-sm text-tinta/70">
            Total:{" "}
            <span className="font-semibold text-noche">{formatPesos(total)}</span>{" "}
            →{" "}
            <span className="font-semibold text-rio">
              {formatPesos(porPersona)} por persona
            </span>
          </p>
        ) : null}
      </div>

      {/* Qué llevar */}
      <div>
        <label
          htmlFor="que_llevar"
          className="mb-1 block text-sm font-medium text-noche"
        >
          Qué llevar
        </label>
        <textarea
          id="que_llevar"
          name="que_llevar"
          rows={3}
          value={queLlevar}
          onChange={(e) => setQueLlevar(e.target.value)}
          placeholder="Ej: protector, agua, snacks, malla"
          className="block w-full resize-none rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl bg-arena/15 px-4 py-3 text-sm text-arena"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Publicando…" : "Publicar salida"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { CATEGORIAS, TRANSPORTE_LABEL } from "@/lib/format";
import MapPicker from "@/components/map/MapPicker";
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

const CATEGORIA_EMOJI: Record<string, string> = {
  lancha_paseo: "🚤",
  pesca: "🎣",
  kayak_remo: "🛶",
  playa_isla: "🏖️",
  asado_isla: "🔥",
  deportes_nauticos: "🏄",
  campamento: "⛺",
  otro: "✨",
};

const PASOS = [
  "¿Qué van a hacer?",
  "¿Cómo llegan al agua?",
  "¿Cuándo y dónde se juntan?",
  "Lo básico",
  "Opciones",
  "¿Todo listo para zarpar?",
];

const TOTAL_PASOS = PASOS.length;
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
  const [step, setStep] = useState(1);

  // Datos acumulados.
  const [categoria, setCategoria] = useState<string>("");
  const [tipoOtro, setTipoOtro] = useState("");
  const [transporte, setTransporte] = useState<string>("");
  const [transporteOtro, setTransporteOtro] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [puntoEncuentro, setPuntoEncuentro] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [cupos, setCupos] = useState(4);
  const [minimo, setMinimo] = useState<number | null>(null);
  const [costos, setCostos] = useState<CostoRow[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [queLlevar, setQueLlevar] = useState("");
  const [esPrivada, setEsPrivada] = useState(false);
  const [cierreOpcion, setCierreOpcion] = useState<
    "inicio" | "1d" | "2d" | "3d" | "custom"
  >("inicio");
  const [cierreCustom, setCierreCustom] = useState("");
  const [sinRestriccionEdad, setSinRestriccionEdad] = useState(true);
  const [edadMin, setEdadMin] = useState(18);
  const [edadMax, setEdadMax] = useState(65);

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = useMemo(
    () => costos.reduce((s, c) => s + (Number(c.monto) || 0), 0),
    [costos],
  );
  const porPersona = cupos > 0 ? Math.ceil(total / cupos) : 0;
  // Mínimo efectivo (clampeado a cupos por si bajaron los cupos después).
  const minimoView = minimo != null ? Math.min(minimo, cupos) : null;

  // Cierre de inscripción → ISO (o "" para null = cierra al empezar la salida).
  function calcularCierreISO(): string {
    if (cierreOpcion === "inicio") return "";
    if (cierreOpcion === "custom") {
      if (!cierreCustom) return "";
      const d = new Date(cierreCustom);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString();
    }
    if (!fechaHora) return "";
    const f = new Date(fechaHora);
    if (Number.isNaN(f.getTime())) return "";
    const dias = cierreOpcion === "1d" ? 1 : cierreOpcion === "2d" ? 2 : 3;
    return new Date(f.getTime() - dias * 86_400_000).toISOString();
  }

  const transporteLabel =
    transporte === "otro"
      ? transporteOtro.trim() || "Otro"
      : TRANSPORTE_LABEL[transporte] ?? transporte;
  const categoriaLabelView =
    categoria === "otro"
      ? tipoOtro.trim() || "Otro"
      : CATEGORIAS.find((c) => c.value === categoria)?.label ?? null;

  function addCosto() {
    setCostos((arr) => [...arr, { id: nuevoId(), concepto: "", monto: "" }]);
  }
  function updateCosto(id: string, patch: Partial<CostoRow>) {
    setCostos((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCosto(id: string) {
    setCostos((arr) => arr.filter((c) => c.id !== id));
  }

  // Devuelve un mensaje de error si el paso no está completo, o null si está OK.
  function validarPaso(n: number): string | null {
    if (n === 1) {
      if (!categoria) return "Elegí qué tipo de salida es.";
      if (categoria === "otro" && !tipoOtro.trim())
        return "Contanos qué tipo de salida es.";
    }
    if (n === 2) {
      if (!transporte) return "Elegí cómo llegan al agua.";
      if (transporte === "otro" && !transporteOtro.trim())
        return "Contanos cómo llegan al agua.";
    }
    if (n === 3) {
      if (!fechaHora) return "Elegí fecha y hora.";
      if (Number.isNaN(new Date(fechaHora).getTime()))
        return "La fecha no es válida.";
    }
    if (n === 4) {
      if (!titulo.trim()) return "Ponele un título a la salida.";
    }
    if (n === 5) {
      if (cierreOpcion === "custom") {
        if (!cierreCustom) return "Elegí cuándo cierra la inscripción.";
        const c = new Date(cierreCustom);
        if (Number.isNaN(c.getTime())) return "La fecha de cierre no es válida.";
        if (fechaHora && c.getTime() >= new Date(fechaHora).getTime())
          return "El cierre tiene que ser antes del inicio de la salida.";
      }
      if (!sinRestriccionEdad) {
        if (edadMin < 18) return "La edad mínima tiene que ser 18 o más.";
        if (edadMin > edadMax)
          return "La edad mínima no puede ser mayor a la máxima.";
      }
    }
    return null;
  }

  function siguiente() {
    const msg = validarPaso(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_PASOS, s + 1));
  }

  function atras() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function publicar() {
    // Revalidar todos los pasos por las dudas.
    for (let n = 1; n <= 5; n++) {
      const msg = validarPaso(n);
      if (msg) {
        setError(msg);
        setStep(n);
        return;
      }
    }
    setError(null);

    const fd = new FormData();
    fd.set("titulo", titulo.trim());
    fd.set("descripcion", descripcion);
    fd.set("punto_encuentro_texto", puntoEncuentro);
    fd.set("fecha_hora_iso", new Date(fechaHora).toISOString());
    fd.set("cupos_total", String(cupos));
    fd.set(
      "participantes_minimos",
      minimoView != null ? String(minimoView) : "",
    );
    fd.set("transporte", transporte);
    fd.set("transporte_otro", transporte === "otro" ? transporteOtro.trim() : "");
    fd.set("categoria", categoria);
    fd.set("tipo_otro", categoria === "otro" ? tipoOtro.trim() : "");
    fd.set("que_llevar", queLlevar);
    fd.set("es_privada", esPrivada ? "1" : "");
    fd.set("cierre_inscripcion_iso", calcularCierreISO());
    fd.set("edad_min", sinRestriccionEdad ? "" : String(edadMin));
    fd.set("edad_max", sinRestriccionEdad ? "" : String(edadMax));
    fd.set("punto_encuentro_lat", lat != null ? String(lat) : "");
    fd.set("punto_encuentro_lng", lng != null ? String(lng) : "");
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
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="px-6 pt-6">
      {/* Barra de progreso (visible siempre) */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-tinta/60">
          <span>
            Paso {step} de {TOTAL_PASOS}
          </span>
          <span className="text-rio">{PASOS[step - 1]}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tinta/10">
          <div
            className="h-full rounded-full bg-rio transition-all"
            style={{ width: `${(step / TOTAL_PASOS) * 100}%` }}
            aria-hidden
          />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-bold tracking-tight text-noche">
        {PASOS[step - 1]}
      </h2>

      <div className="mt-5">
        {/* ── Paso 1: tipo ───────────────────────────────────────────── */}
        {step === 1 ? (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIAS.map((opt) => {
                const active = categoria === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoria(opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-5 text-center transition active:scale-[0.98] ${
                      active
                        ? "border-rio bg-rio/10"
                        : "border-tinta/10 bg-white"
                    }`}
                  >
                    <span className="text-4xl">
                      {CATEGORIA_EMOJI[opt.value] ?? "🌊"}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        active ? "text-rio" : "text-noche"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {categoria === "otro" ? (
              <div className="mt-4">
                <label
                  htmlFor="tipo_otro"
                  className="mb-1 block text-sm font-medium text-noche"
                >
                  ¿Cuál? <span className="text-arena">*</span>
                </label>
                <input
                  id="tipo_otro"
                  type="text"
                  autoFocus
                  value={tipoOtro}
                  onChange={(e) => setTipoOtro(e.target.value)}
                  maxLength={60}
                  placeholder="Ej: avistaje de aves, fotografía, limpieza de costa…"
                  className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Paso 2: transporte ─────────────────────────────────────── */}
        {step === 2 ? (
          <div>
            <div className="flex flex-wrap gap-2">
              {TRANSPORTES.map((opt) => {
                const active = transporte === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransporte(opt.value)}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
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

            {transporte === "otro" ? (
              <div className="mt-4">
                <label
                  htmlFor="transporte_otro"
                  className="mb-1 block text-sm font-medium text-noche"
                >
                  ¿Cuál? <span className="text-arena">*</span>
                </label>
                <input
                  id="transporte_otro"
                  type="text"
                  autoFocus
                  value={transporteOtro}
                  onChange={(e) => setTransporteOtro(e.target.value)}
                  maxLength={60}
                  placeholder="Ej: moto de agua, velero, canoa…"
                  className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Paso 3: cuándo y dónde ─────────────────────────────────── */}
        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="fecha_hora"
                className="mb-1 block text-sm font-medium text-noche"
              >
                Fecha y hora <span className="text-arena">*</span>
              </label>
              <input
                id="fecha_hora"
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="punto_encuentro_texto"
                className="mb-1 block text-sm font-medium text-noche"
              >
                Punto de encuentro
              </label>
              <input
                id="punto_encuentro_texto"
                type="text"
                value={puntoEncuentro}
                onChange={(e) => setPuntoEncuentro(e.target.value)}
                placeholder='Ej: "Bajada Sargento Cabral"'
                className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
              <p className="mb-2 mt-3 text-xs text-tinta/50">
                Tocá el mapa para marcar el punto exacto. Podés arrastrar el pin
                para ajustarlo.
              </p>
              <MapPicker
                lat={lat}
                lng={lng}
                onChange={(la, ln) => {
                  setLat(la);
                  setLng(ln);
                }}
              />
              {lat != null && lng != null ? (
                <p className="mt-2 text-xs text-tinta/50">
                  📍 Pin en {lat.toFixed(5)}, {lng.toFixed(5)}.
                </p>
              ) : null}
              {puntoEncuentro.trim() && (lat == null || lng == null) ? (
                <p className="mt-2 rounded-xl bg-arena/10 px-3 py-2 text-xs leading-relaxed text-arena">
                  📍 Marcá el punto en el mapa para que tus invitados sepan cómo
                  llegar — sobre todo si no tiene dirección exacta.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── Paso 4: lo básico ──────────────────────────────────────── */}
        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="titulo"
                className="mb-1 block text-sm font-medium text-noche"
              >
                Título <span className="text-arena">*</span>
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                placeholder='Ej: "Domingo en Charigüé"'
                className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
            </div>

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
            </div>

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
                  Sin costos compartidos. Si hay nafta, lancha o algo a dividir,
                  sumalo.
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
                  <span className="font-semibold text-noche">
                    {formatPesos(total)}
                  </span>{" "}
                  →{" "}
                  <span className="font-semibold text-rio">
                    {formatPesos(porPersona)} por persona
                  </span>
                </p>
              ) : null}
            </div>

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
                rows={3}
                maxLength={MAX_DESC}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Contale a la tripulación de qué va la salida"
                className="block w-full resize-none rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="que_llevar"
                className="mb-1 block text-sm font-medium text-noche"
              >
                Qué llevar
              </label>
              <textarea
                id="que_llevar"
                rows={2}
                value={queLlevar}
                onChange={(e) => setQueLlevar(e.target.value)}
                placeholder="Ej: protector, agua, snacks, malla"
                className="block w-full resize-none rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              />
            </div>
          </div>
        ) : null}

        {/* ── Paso 5: opciones (todo opcional) ───────────────────────── */}
        {step === 5 ? (
          <div className="space-y-6">
            <p className="rounded-2xl bg-rio/5 px-4 py-3 text-sm text-tinta/70">
              Todo esto es opcional — dejá lo que no uses como está.
            </p>

            {/* Mínimo para salir (cuórum) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-noche">
                Mínimo para salir{" "}
                <span className="font-normal text-tinta/40">(opcional)</span>
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-tinta/15 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setMinimo(
                      minimoView == null
                        ? null
                        : minimoView <= 2
                          ? null
                          : minimoView - 1,
                    )
                  }
                  disabled={minimoView == null}
                  className="grid h-10 w-10 place-items-center rounded-full bg-crema text-xl font-semibold text-noche disabled:opacity-40"
                  aria-label="Bajar el mínimo"
                >
                  −
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-noche">
                    {minimoView == null ? "Sin mínimo" : minimoView}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-tinta/50">
                    {minimoView == null ? "se sale igual" : "para zarpar"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMinimo(
                      minimoView == null ? 2 : Math.min(cupos, minimoView + 1),
                    )
                  }
                  disabled={minimoView != null && minimoView >= cupos}
                  className="grid h-10 w-10 place-items-center rounded-full bg-rio text-xl font-semibold text-crema disabled:opacity-40"
                  aria-label="Subir el mínimo"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-xs text-tinta/50">
                Si no llegás a este número, podés cancelar sin que cuente como
                baja.
              </p>
            </div>

            {/* Cierre de inscripción */}
            <div>
              <label
                htmlFor="cierre_opcion"
                className="mb-1 block text-sm font-medium text-noche"
              >
                ¿Hasta cuándo se pueden sumar?
              </label>
              <select
                id="cierre_opcion"
                value={cierreOpcion}
                onChange={(e) =>
                  setCierreOpcion(
                    e.target.value as typeof cierreOpcion,
                  )
                }
                className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
              >
                <option value="inicio">Hasta que empiece la salida</option>
                <option value="1d">1 día antes</option>
                <option value="2d">2 días antes</option>
                <option value="3d">3 días antes</option>
                <option value="custom">Fecha y hora específica</option>
              </select>
              {cierreOpcion === "custom" ? (
                <input
                  type="datetime-local"
                  value={cierreCustom}
                  max={fechaHora || undefined}
                  onChange={(e) => setCierreCustom(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
                />
              ) : null}
              <p className="mt-1 text-xs text-tinta/50">
                Después de esta fecha nadie más puede pedir sumarse.
              </p>
            </div>

            {/* Rango de edad */}
            <div>
              <label className="mb-1 block text-sm font-medium text-noche">
                Rango de edad{" "}
                <span className="font-normal text-tinta/40">(opcional)</span>
              </label>
              <button
                type="button"
                onClick={() => setSinRestriccionEdad((v) => !v)}
                aria-pressed={sinRestriccionEdad}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                  sinRestriccionEdad
                    ? "border-rio bg-rio/10"
                    : "border-tinta/15 bg-white"
                }`}
              >
                <span className="text-sm font-medium text-noche">
                  Sin restricción de edad
                </span>
                <span
                  className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                    sinRestriccionEdad ? "bg-rio" : "bg-tinta/20"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      sinRestriccionEdad ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </button>

              {!sinRestriccionEdad ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <EdadStepper
                    label="Desde"
                    value={edadMin}
                    min={18}
                    max={edadMax}
                    onChange={setEdadMin}
                  />
                  <EdadStepper
                    label="Hasta"
                    value={edadMax}
                    min={Math.max(18, edadMin)}
                    max={99}
                    onChange={setEdadMax}
                  />
                </div>
              ) : null}
            </div>

            {/* Salida privada */}
            <button
              type="button"
              onClick={() => setEsPrivada((v) => !v)}
              aria-pressed={esPrivada}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                esPrivada
                  ? "border-rio bg-rio/10"
                  : "border-tinta/15 bg-white"
              }`}
            >
              <span className="mt-0.5 text-xl" aria-hidden>
                🔒
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-noche">
                  ¿Salida privada?
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-tinta/60">
                  Solo la gente con el link puede verla y sumarse. No aparece en
                  el feed.
                </span>
              </span>
              <span
                className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                  esPrivada ? "bg-rio" : "bg-tinta/20"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    esPrivada ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </div>
        ) : null}

        {/* ── Paso 6: resumen ────────────────────────────────────────── */}
        {step === 6 ? (
          <div className="space-y-3">
            <ResumenRow
              label="Tipo"
              value={categoriaLabelView ?? "—"}
              onEdit={() => setStep(1)}
            />
            <ResumenRow
              label="Cómo llegan"
              value={transporteLabel}
              onEdit={() => setStep(2)}
            />
            <ResumenRow
              label="Cuándo"
              value={
                fechaHora
                  ? new Date(fechaHora).toLocaleString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"
              }
              onEdit={() => setStep(3)}
            />
            <ResumenRow
              label="Dónde"
              value={
                puntoEncuentro ||
                (lat != null && lng != null ? "Punto en el mapa" : "—")
              }
              onEdit={() => setStep(3)}
            />
            <ResumenRow label="Título" value={titulo || "—"} onEdit={() => setStep(4)} />
            <ResumenRow
              label="Cupos"
              value={`${cupos} personas`}
              onEdit={() => setStep(4)}
            />
            <ResumenRow
              label="Costos"
              value={
                total > 0
                  ? `${formatPesos(total)} · ${formatPesos(porPersona)} c/u`
                  : "Sin costo"
              }
              onEdit={() => setStep(4)}
            />
            <ResumenRow
              label="Mínimo para salir"
              value={minimoView != null ? `${minimoView} personas` : "Sin mínimo"}
              onEdit={() => setStep(5)}
            />
            <ResumenRow
              label="Visibilidad"
              value={
                esPrivada
                  ? "🔒 Privada · solo por link"
                  : "Pública · aparece en el feed"
              }
              onEdit={() => setStep(5)}
            />
            <ResumenRow
              label="Cierre inscripción"
              value={
                cierreOpcion === "inicio"
                  ? "Hasta que empiece la salida"
                  : cierreOpcion === "custom"
                    ? cierreCustom
                      ? new Date(cierreCustom).toLocaleString("es-AR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                    : cierreOpcion === "1d"
                      ? "1 día antes"
                      : cierreOpcion === "2d"
                        ? "2 días antes"
                        : "3 días antes"
              }
              onEdit={() => setStep(5)}
            />
            <ResumenRow
              label="Edad"
              value={
                sinRestriccionEdad
                  ? "Sin restricción"
                  : `De ${edadMin} a ${edadMax} años`
              }
              onEdit={() => setStep(5)}
            />
            {descripcion.trim() ? (
              <ResumenRow
                label="Descripción"
                value={descripcion.trim()}
                onEdit={() => setStep(4)}
              />
            ) : null}
            {queLlevar.trim() ? (
              <ResumenRow
                label="Qué llevar"
                value={queLlevar.trim()}
                onEdit={() => setStep(4)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl bg-arena/15 px-4 py-3 text-sm text-arena"
        >
          {error}
        </div>
      ) : null}

      {/* Navegación */}
      <div className="mt-8 flex items-center gap-3 pb-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={atras}
            disabled={pending}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-tinta/15 bg-white px-6 text-base font-semibold text-tinta/70 transition active:scale-[0.98] disabled:opacity-60"
          >
            Atrás
          </button>
        ) : null}

        {step < TOTAL_PASOS ? (
          <button
            type="button"
            onClick={siguiente}
            className="inline-flex h-12 flex-[2] items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={publicar}
            disabled={pending}
            className="inline-flex h-12 flex-[2] items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Publicando…" : "Publicar salida"}
          </button>
        )}
      </div>
    </div>
  );
}

function EdadStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-tinta/50">
        {label}
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-tinta/15 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid h-9 w-9 place-items-center rounded-full bg-crema text-lg font-semibold text-noche disabled:opacity-40"
          aria-label={`Bajar ${label.toLowerCase()}`}
        >
          −
        </button>
        <span className="text-xl font-bold text-noche">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="grid h-9 w-9 place-items-center rounded-full bg-rio text-lg font-semibold text-crema disabled:opacity-40"
          aria-label={`Subir ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ResumenRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-tinta/40">
          {label}
        </div>
        <div className="mt-0.5 whitespace-pre-line text-sm font-medium text-noche">
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-semibold text-rio"
      >
        Editar
      </button>
    </div>
  );
}

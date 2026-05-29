import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TRANSPORTE_LABEL,
  formatFechaLarga,
  formatPesos,
} from "@/lib/format";

type Costo = { concepto: string; monto: number };

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function SalidaDetallePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nueva?: string };
}) {
  const supabase = createClient();

  const { data: salida } = await supabase
    .from("salidas")
    .select(
      "id, titulo, descripcion, punto_encuentro_texto, fecha_hora, cupos_total, cupos_ocupados, transporte, costos, que_llevar, estado, host_id",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!salida) {
    notFound();
  }

  // Solo columnas públicas del host. La policy de anon en profiles igual no
  // expone más que esto al código.
  const { data: host } = await supabase
    .from("profiles")
    .select("nombre, foto_url, reputacion_promedio, verificado")
    .eq("id", salida!.host_id)
    .maybeSingle();

  const costos = Array.isArray(salida!.costos)
    ? (salida!.costos as Costo[])
    : [];
  const total = costos.reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const porPersona =
    salida!.cupos_total > 0 ? Math.ceil(total / salida!.cupos_total) : 0;

  const recienCreada = searchParams.nueva === "1";

  return (
    <div className="px-6 pt-10">
      {recienCreada ? (
        <div className="mb-4 rounded-2xl bg-rio/10 px-4 py-3 text-sm font-medium text-rio">
          ✅ Salida publicada — compartila con tu gente.
        </div>
      ) : null}

      <header>
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
                {formatPesos(total)}
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
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "../_lib";
import { CATEGORIA_LABEL, formatFechaCorta } from "@/lib/format";
import CancelarSalidaBtn from "./CancelarSalidaBtn";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type SalidaRow = {
  id: string;
  titulo: string;
  categoria: string | null;
  tipo: string;
  fecha_hora: string;
  cupos_total: number;
  cupos_ocupados: number;
  estado: string;
  host: { nombre: string | null } | { nombre: string | null }[] | null;
};

export default async function AdminSalidasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");
  const { admin } = ctx;

  const pageNum = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (pageNum - 1) * PER_PAGE;

  const { data, count } = await admin
    .from("salidas")
    .select(
      "id, titulo, categoria, tipo, fecha_hora, cupos_total, cupos_ocupados, estado, host:profiles!salidas_host_id_fkey (nombre)",
      { count: "exact" },
    )
    .order("fecha_hora", { ascending: false })
    .range(from, from + PER_PAGE - 1);

  const rows = (data ?? []) as unknown as SalidaRow[];
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
  const hostNombre = (h: SalidaRow["host"]) =>
    (Array.isArray(h) ? h[0]?.nombre : h?.nombre) ?? "—";

  return (
    <div>
      <h2 className="text-lg font-semibold text-noche">
        Salidas <span className="text-sm font-normal text-tinta/50">({total})</span>
      </h2>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-tinta/10 text-[11px] uppercase tracking-wide text-tinta/50">
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Host</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Cupos</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-tinta/50">
                  No hay salidas.
                </td>
              </tr>
            ) : (
              rows.map((s) => {
                const cancelable =
                  s.estado === "abierta" || s.estado === "completa";
                return (
                  <tr
                    key={s.id}
                    className="border-b border-tinta/5 last:border-0 hover:bg-crema/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/salida/${s.id}`}
                        className="font-semibold text-rio hover:underline"
                      >
                        {s.titulo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-tinta/70">
                      {hostNombre(s.host)}
                    </td>
                    <td className="px-4 py-3 text-tinta/60">
                      {s.categoria
                        ? CATEGORIA_LABEL[s.categoria] ?? s.categoria
                        : s.tipo}
                    </td>
                    <td className="px-4 py-3 text-tinta/60">
                      {formatFechaCorta(s.fecha_hora)}
                    </td>
                    <td className="px-4 py-3 text-tinta/70">
                      {s.cupos_ocupados}/{s.cupos_total}
                    </td>
                    <td className="px-4 py-3 text-tinta/70">{s.estado}</td>
                    <td className="px-4 py-3">
                      {cancelable ? (
                        <CancelarSalidaBtn salidaId={s.id} />
                      ) : (
                        <span className="text-xs text-tinta/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          {pageNum > 1 ? (
            <Link
              href={`/admin/salidas?page=${pageNum - 1}`}
              className="font-semibold text-rio"
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-tinta/50">
            Página {pageNum} de {totalPaginas}
          </span>
          {pageNum < totalPaginas ? (
            <Link
              href={`/admin/salidas?page=${pageNum + 1}`}
              className="font-semibold text-rio"
            >
              Siguiente →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </div>
  );
}

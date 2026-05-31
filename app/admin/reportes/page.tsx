import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminContext } from "../_lib";
import { formatFechaCorta } from "@/lib/format";
import ReporteAcciones from "./ReporteAcciones";

export const dynamic = "force-dynamic";

type ReporteRow = {
  id: string;
  motivo: string;
  created_at: string;
  reportado: string;
  reporter: { nombre: string | null } | { nombre: string | null }[] | null;
  reportada: { nombre: string | null } | { nombre: string | null }[] | null;
};

export default async function AdminReportesPage() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");
  const { admin } = ctx;

  const { data } = await admin
    .from("reportes")
    .select(
      "id, motivo, created_at, reportado, reporter:profiles!reportes_reporter_fkey (nombre), reportada:profiles!reportes_reportado_fkey (nombre)",
    )
    .eq("resuelto", false)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as ReporteRow[];
  const nombre = (p: ReporteRow["reporter"]) =>
    (Array.isArray(p) ? p[0]?.nombre : p?.nombre) ?? "—";

  return (
    <div>
      <h2 className="text-lg font-semibold text-noche">
        Reportes pendientes{" "}
        <span className="text-sm font-normal text-tinta/50">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-tinta/15 bg-white/50 px-4 py-8 text-center text-sm text-tinta/60">
          No hay reportes sin resolver. 🎉
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-tinta/80">
                  <span className="font-semibold text-noche">
                    {nombre(r.reporter)}
                  </span>{" "}
                  reportó a{" "}
                  <Link
                    href={`/admin/usuarios/${r.reportado}`}
                    className="font-semibold text-rio hover:underline"
                  >
                    {nombre(r.reportada)}
                  </Link>
                </p>
                <span className="text-xs text-tinta/40">
                  {formatFechaCorta(r.created_at)}
                </span>
              </div>
              <p className="mt-2 rounded-xl bg-crema px-3 py-2 text-sm italic text-tinta/75">
                “{r.motivo}”
              </p>
              <div className="mt-3">
                <ReporteAcciones reporteId={r.id} reportadoId={r.reportado} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

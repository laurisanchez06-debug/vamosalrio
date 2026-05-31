import { redirect } from "next/navigation";
import { getAdminContext } from "./_lib";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");
  const { admin } = ctx;

  const hace7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [usuarios, abiertas, nuevos, reportes] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("salidas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "abierta"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hace7d),
    admin
      .from("reportes")
      .select("id", { count: "exact", head: true })
      .eq("resuelto", false),
  ]);

  const cards = [
    { label: "Usuarios registrados", value: usuarios.count ?? 0 },
    { label: "Salidas abiertas ahora", value: abiertas.count ?? 0 },
    { label: "Nuevos (últimos 7 días)", value: nuevos.count ?? 0 },
    { label: "Reportes sin resolver", value: reportes.count ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-noche">Resumen</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-3xl font-bold text-noche">{c.value}</div>
            <div className="mt-1 text-sm text-tinta/60">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

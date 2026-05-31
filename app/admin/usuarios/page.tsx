import Link from "next/link";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminContext } from "../_lib";
import { formatFechaCorta } from "@/lib/format";
import RangoBadge from "@/components/RangoBadge";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type AuthUser = { id: string; email: string | null; created_at: string };

async function todosLosUsuariosAuth(admin: SupabaseClient): Promise<AuthUser[]> {
  const out: AuthUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) break;
    const users = data?.users ?? [];
    for (const u of users) {
      out.push({ id: u.id, email: u.email ?? null, created_at: u.created_at });
    }
    if (users.length < 200) break;
  }
  return out;
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");
  const { admin } = ctx;

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const pageNum = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const [authUsers, profilesRes, salidasRes, partsRes] = await Promise.all([
    todosLosUsuariosAuth(admin),
    admin
      .from("profiles")
      .select("id, nombre, rango_host, rango_tripulante, bloqueado, created_at"),
    admin.from("salidas").select("host_id"),
    admin.from("participaciones").select("user_id").eq("estado", "aceptado"),
  ]);

  const emailDe = new Map(authUsers.map((u) => [u.id, u.email]));
  const comoHost = new Map<string, number>();
  for (const s of (salidasRes.data ?? []) as { host_id: string }[]) {
    comoHost.set(s.host_id, (comoHost.get(s.host_id) ?? 0) + 1);
  }
  const comoInvitado = new Map<string, number>();
  for (const p of (partsRes.data ?? []) as { user_id: string }[]) {
    comoInvitado.set(p.user_id, (comoInvitado.get(p.user_id) ?? 0) + 1);
  }

  type Row = {
    id: string;
    nombre: string | null;
    email: string | null;
    created_at: string;
    host: number;
    invitado: number;
    rango_host: string | null;
    rango_tripulante: string | null;
    bloqueado: boolean;
  };

  const rows: Row[] = (
    (profilesRes.data ?? []) as Array<{
      id: string;
      nombre: string | null;
      rango_host: string | null;
      rango_tripulante: string | null;
      bloqueado: boolean;
      created_at: string;
    }>
  ).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    email: emailDe.get(p.id) ?? null,
    created_at: p.created_at,
    host: comoHost.get(p.id) ?? 0,
    invitado: comoInvitado.get(p.id) ?? 0,
    rango_host: p.rango_host,
    rango_tripulante: p.rango_tripulante,
    bloqueado: p.bloqueado,
  }));

  const filtradas = q
    ? rows.filter(
        (r) =>
          (r.nombre ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      )
    : rows;
  filtradas.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PER_PAGE));
  const page = Math.min(pageNum, totalPaginas);
  const visibles = filtradas.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const qs = (p: number) =>
    `/admin/usuarios?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-noche">
          Usuarios{" "}
          <span className="text-sm font-normal text-tinta/50">
            ({filtradas.length})
          </span>
        </h2>
      </div>

      <form method="get" className="mt-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Buscar por nombre o email…"
          className="min-w-0 flex-1 rounded-2xl border border-tinta/15 bg-white px-4 py-2.5 text-sm outline-none ring-rio/40 focus:border-rio focus:ring-2"
        />
        <button
          type="submit"
          className="shrink-0 rounded-2xl bg-rio px-4 text-sm font-semibold text-crema"
        >
          Buscar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-tinta/10 text-[11px] uppercase tracking-wide text-tinta/50">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Registro</th>
              <th className="px-4 py-3 font-semibold">Host</th>
              <th className="px-4 py-3 font-semibold">Invitado</th>
              <th className="px-4 py-3 font-semibold">Rango</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-tinta/50">
                  No hay usuarios que coincidan.
                </td>
              </tr>
            ) : (
              visibles.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-tinta/5 last:border-0 hover:bg-crema/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/usuarios/${r.id}`}
                      className="font-semibold text-rio hover:underline"
                    >
                      {r.nombre ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-tinta/70">{r.email ?? "—"}</td>
                  <td className="px-4 py-3 text-tinta/60">
                    {formatFechaCorta(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-tinta/70">{r.host}</td>
                  <td className="px-4 py-3 text-tinta/70">{r.invitado}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <RangoBadge rango={r.rango_host} />
                      <RangoBadge rango={r.rango_tripulante} />
                      {!r.rango_host && !r.rango_tripulante ? (
                        <span className="text-tinta/40">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.bloqueado ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Activo
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="font-semibold text-rio">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-tinta/50">
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas ? (
            <Link href={qs(page + 1)} className="font-semibold text-rio">
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

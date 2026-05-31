import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminContext, emailDe } from "../../_lib";
import { formatFechaCorta } from "@/lib/format";
import RangoBadge from "@/components/RangoBadge";
import BloquearToggle from "./BloquearToggle";

export const dynamic = "force-dynamic";

type SalidaMini = {
  id: string;
  titulo: string;
  fecha_hora: string;
  estado: string;
};

export default async function AdminUsuarioDetalle({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");
  const { admin } = ctx;
  const id = params.id;

  const { data: perfil } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!perfil) notFound();

  const [email, hostRes, invitadoRes, califRes] = await Promise.all([
    emailDe(admin, id),
    admin
      .from("salidas")
      .select("id, titulo, fecha_hora, estado")
      .eq("host_id", id)
      .order("fecha_hora", { ascending: false }),
    admin
      .from("participaciones")
      .select(
        "estado, salida:salidas!participaciones_salida_id_fkey (id, titulo, fecha_hora, estado)",
      )
      .eq("user_id", id)
      .eq("estado", "aceptado"),
    admin
      .from("calificaciones")
      .select(
        "puntaje, comentario, rol_calificado, created_at, autor:profiles!calificaciones_from_user_fkey (nombre)",
      )
      .eq("to_user", id)
      .order("created_at", { ascending: false }),
  ]);

  const unwrap = <T,>(p: T | T[] | null): T | null =>
    !p ? null : Array.isArray(p) ? (p[0] ?? null) : p;

  const comoHost = (hostRes.data ?? []) as SalidaMini[];
  const comoInvitado = ((invitadoRes.data ?? []) as { salida: SalidaMini | SalidaMini[] | null }[])
    .map((r) => unwrap(r.salida))
    .filter((s): s is SalidaMini => !!s);
  const califs = (califRes.data ?? []) as Array<{
    puntaje: number;
    comentario: string | null;
    rol_calificado: string;
    created_at: string;
    autor: { nombre: string | null } | { nombre: string | null }[] | null;
  }>;

  return (
    <div>
      <Link
        href="/admin/usuarios"
        className="text-sm font-medium text-tinta/60 hover:text-rio"
      >
        ← Usuarios
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-noche">
              {perfil.nombre ?? "Sin nombre"}
            </h2>
            <RangoBadge rango={perfil.rango_host} />
            <RangoBadge rango={perfil.rango_tripulante} />
            {perfil.bloqueado ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                Bloqueado
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-tinta/60">{email ?? "—"}</p>
          <p className="text-xs text-tinta/40">
            Registro: {formatFechaCorta(perfil.created_at)} · Reputación{" "}
            {Number(perfil.reputacion_promedio ?? 0).toFixed(1)} ·{" "}
            {perfil.cancelaciones_tardias ?? 0} cancelaciones tardías
          </p>
        </div>
        <BloquearToggle userId={id} bloqueado={!!perfil.bloqueado} />
      </header>

      {perfil.bio ? (
        <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-relaxed text-tinta/80 shadow-sm">
          {perfil.bio}
        </p>
      ) : null}

      <Seccion titulo={`Salidas como host (${comoHost.length})`}>
        <ListaSalidas items={comoHost} />
      </Seccion>

      <Seccion titulo={`Salidas como invitado (${comoInvitado.length})`}>
        <ListaSalidas items={comoInvitado} />
      </Seccion>

      <Seccion titulo={`Calificaciones recibidas (${califs.length})`}>
        {califs.length === 0 ? (
          <p className="text-sm text-tinta/50">Todavía no recibió ninguna.</p>
        ) : (
          <ul className="space-y-2">
            {califs.map((c, i) => {
              const autor = unwrap(c.autor);
              return (
                <li key={i} className="rounded-2xl bg-white p-3 text-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-arena">
                      {"★".repeat(c.puntaje)}
                      <span className="text-tinta/20">
                        {"★".repeat(5 - c.puntaje)}
                      </span>
                    </span>
                    <span className="text-xs text-tinta/50">
                      {autor?.nombre ?? "Anónimo"} · como {c.rol_calificado}
                    </span>
                  </div>
                  {c.comentario ? (
                    <p className="mt-1 text-tinta/75">“{c.comentario}”</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Seccion>
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-tinta/50">
        {titulo}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ListaSalidas({ items }: { items: SalidaMini[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-tinta/50">Ninguna.</p>;
  }
  return (
    <ul className="divide-y divide-tinta/5 overflow-hidden rounded-2xl bg-white shadow-sm">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/salida/${s.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-crema/60"
          >
            <span className="min-w-0 flex-1 truncate font-medium text-noche">
              {s.titulo}
            </span>
            <span className="shrink-0 text-xs text-tinta/50">
              {formatFechaCorta(s.fecha_hora)}
            </span>
            <span className="shrink-0 text-xs font-semibold text-tinta/60">
              {s.estado}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

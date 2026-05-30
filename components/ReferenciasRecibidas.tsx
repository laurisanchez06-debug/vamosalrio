import { createAdminClient } from "@/lib/supabase/admin";

type AutorMin = { nombre: string | null; foto_url: string | null };

type RefRow = {
  comentario: string | null;
  created_at: string;
  from_user: string;
  autor: AutorMin | AutorMin[] | null;
};

function unwrap<T>(p: T | T[] | null): T | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Lee las referencias (calificaciones con comentario) recibidas por un usuario,
// con service_role, para no depender de la RLS de calificaciones.
export default async function ReferenciasRecibidas({
  userId,
}: {
  userId: string;
}) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("calificaciones")
    .select(
      "comentario, created_at, from_user, autor:profiles!calificaciones_from_user_fkey (nombre, foto_url)",
    )
    .eq("to_user", userId)
    .not("comentario", "is", null)
    .order("created_at", { ascending: false });

  const refs = ((data ?? []) as unknown as RefRow[]).filter(
    (r) => (r.comentario ?? "").trim() !== "",
  );

  if (refs.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta/60">
        Referencias
      </h2>
      <ul className="mt-3 space-y-3">
        {refs.map((r, i) => {
          const autor = unwrap(r.autor);
          return (
            <li key={i} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-xs font-bold text-crema">
                  {autor?.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={autor.foto_url}
                      alt={autor.nombre ?? "Autor"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials(autor?.nombre)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-noche">
                    {autor?.nombre ?? "Anónimo"}
                  </div>
                  <div className="text-xs text-tinta/40">
                    {formatFecha(r.created_at)}
                  </div>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-tinta/80">
                {r.comentario}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

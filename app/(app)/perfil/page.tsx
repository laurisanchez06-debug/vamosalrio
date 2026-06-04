import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RangoBadge from "@/components/RangoBadge";
import ReferenciasRecibidas from "@/components/ReferenciasRecibidas";
import PushToggle from "@/components/PushToggle";
import { signOutAction } from "./actions";

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nombre, foto_url, bio, instagram_handle, reputacion_promedio, salidas_creadas, salidas_asistidas, es_capitan, rango_host, rango_tripulante, cancelaciones_tardias",
    )
    .eq("id", user!.id)
    .maybeSingle();

  const iniciales = (profile?.nombre ?? user!.email ?? "?")
    .split(" ")
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-6 pt-10">
      <header className="flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-rio text-2xl font-bold text-crema">
          {profile?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.foto_url}
              alt={profile.nombre ?? "Perfil"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{iniciales}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-noche">
              {profile?.nombre ?? "Tu perfil"}
            </h1>
            <RangoBadge rango={profile?.rango_host} />
            <RangoBadge rango={profile?.rango_tripulante} />
          </div>
          {(profile?.cancelaciones_tardias ?? 0) > 0 ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              ⚠️ {profile!.cancelaciones_tardias}{" "}
              {profile!.cancelaciones_tardias === 1
                ? "cancelación de último momento"
                : "cancelaciones de último momento"}
            </p>
          ) : null}
          {profile?.instagram_handle ? (
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-rio"
            >
              @{profile.instagram_handle}
            </a>
          ) : (
            <p className="text-sm text-tinta/50">{user!.email}</p>
          )}
        </div>
      </header>

      {profile?.bio ? (
        <p className="mt-6 rounded-2xl bg-white p-4 text-sm leading-relaxed text-tinta/80 shadow-sm">
          {profile.bio}
        </p>
      ) : null}

      <section className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-noche">
            {Number(profile?.reputacion_promedio ?? 0).toFixed(1)}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-tinta/50">
            Reputación
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-noche">
            {profile?.salidas_creadas ?? 0}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-tinta/50">
            Creadas
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-noche">
            {profile?.salidas_asistidas ?? 0}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-tinta/50">
            Asistidas
          </div>
        </div>
      </section>

      <ReferenciasRecibidas userId={user!.id} />

      <section className="mt-8">
        <PushToggle />
      </section>

      <section className="mt-8 space-y-3">
        <Link
          href="/completar-perfil"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-noche shadow-sm"
        >
          Editar perfil
          <span aria-hidden className="text-tinta/40">
            ›
          </span>
        </Link>

        <Link
          href="/ayuda"
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-noche shadow-sm"
        >
          Ayuda
          <span aria-hidden className="text-tinta/40">
            ›
          </span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-tinta/15 bg-crema px-4 py-3 text-sm font-semibold text-arena"
          >
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}

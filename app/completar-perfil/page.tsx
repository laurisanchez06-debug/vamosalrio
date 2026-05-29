import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/components/AuthCard";
import { completarPerfilAction } from "./actions";

export default async function CompletarPerfilPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, bio, instagram_handle, foto_url")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <AuthCard
      titulo="Completá tu perfil"
      subtitulo="Así la gente sabe quién sos antes de salir al río."
    >
      <form
        action={completarPerfilAction}
        encType="multipart/form-data"
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="nombre"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Nombre <span className="text-arena">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={profile?.nombre ?? ""}
            placeholder="Cómo querés que te llamen"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="foto"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Foto de perfil
          </label>
          <input
            id="foto"
            name="foto"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-tinta/70 file:mr-4 file:rounded-xl file:border-0 file:bg-noche file:px-4 file:py-2 file:text-sm file:font-semibold file:text-crema"
          />
          {profile?.foto_url ? (
            <p className="mt-2 text-xs text-tinta/50">
              Ya tenés una foto. Subí otra si querés cambiarla.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={200}
            defaultValue={profile?.bio ?? ""}
            placeholder="Una línea sobre vos (max 200)"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="instagram_handle"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Instagram
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-tinta/15 bg-white px-4 py-3 ring-rio/40 focus-within:border-rio focus-within:ring-2">
            <span className="text-tinta/50">@</span>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              defaultValue={profile?.instagram_handle ?? ""}
              placeholder="tu_usuario"
              className="flex-1 bg-transparent text-base outline-none"
            />
          </div>
        </div>

        {searchParams.error ? (
          <p className="rounded-xl bg-arena/15 px-4 py-3 text-sm text-arena">
            {searchParams.error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
        >
          Guardar y entrar
        </button>
      </form>
    </AuthCard>
  );
}

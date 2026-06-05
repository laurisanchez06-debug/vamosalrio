import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthCard from "@/components/AuthCard";
import { GENEROS } from "@/lib/format";
import FotoPerfilField from "@/components/FotoPerfilField";
import { completarPerfilAction } from "./actions";

const INTERESES = [
  "Lancha / paseo",
  "Pesca",
  "Kayak / remo",
  "Playa / isla",
  "Asado en isla",
  "Deportes náuticos",
];

export default async function CompletarPerfilPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
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
    .select(
      "nombre, bio, instagram_handle, foto_url, intereses, fecha_nacimiento, genero",
    )
    .eq("id", user!.id)
    .maybeSingle();

  const intereses =
    ((profile as { intereses?: string[] | null } | null)?.intereses) ?? [];

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
        {searchParams.redirect ? (
          <input type="hidden" name="redirect" value={searchParams.redirect} />
        ) : null}
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
            htmlFor="fecha_nacimiento"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Fecha de nacimiento <span className="text-arena">*</span>
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
            defaultValue={profile?.fecha_nacimiento ?? ""}
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
          <p className="mt-1 text-xs text-tinta/50">
            Tenés que ser mayor de 18 años.
          </p>
        </div>

        <div>
          <label
            htmlFor="genero"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Género <span className="text-arena">*</span>
          </label>
          <select
            id="genero"
            name="genero"
            required
            defaultValue={profile?.genero ?? ""}
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          >
            <option value="" disabled>
              Elegí una opción
            </option>
            {GENEROS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <FotoPerfilField
          nombre={profile?.nombre ?? null}
          fotoUrl={profile?.foto_url ?? null}
        />

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Presentate: ¿quién sos y qué onda tus salidas?
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={200}
            defaultValue={profile?.bio ?? ""}
            placeholder="Ej: Fanático del río y el mate. Suelo armar asados en la isla los findes."
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-noche">
            ¿Qué te gusta hacer en el río?
          </span>
          <p className="mb-2 text-xs text-tinta/50">Tocá los que te representen.</p>
          <div className="flex flex-wrap gap-2">
            {INTERESES.map((interes) => (
              <label key={interes} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="intereses"
                  value={interes}
                  defaultChecked={intereses.includes(interes)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-tinta/15 bg-white px-3 py-1.5 text-sm font-medium text-tinta/70 transition peer-checked:border-rio peer-checked:bg-rio peer-checked:text-crema">
                  {interes}
                </span>
              </label>
            ))}
          </div>
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

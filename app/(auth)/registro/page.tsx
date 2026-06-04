import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { GENEROS } from "@/lib/format";
import { signUpAction } from "./actions";

export default function RegistroPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <AuthCard
      titulo="Crear cuenta"
      subtitulo="Sumate y empezá a armar salidas al río."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link
            href={`/login${searchParams.redirect ? `?redirect=${encodeURIComponent(searchParams.redirect)}` : ""}`}
            className="font-semibold text-rio"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form action={signUpAction} className="space-y-4">
        {searchParams.redirect ? (
          <input type="hidden" name="redirect" value={searchParams.redirect} />
        ) : null}

        {/* Honeypot anti-bot: oculto para humanos, los bots lo completan. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="website">No completar este campo</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="vos@ejemplo.com"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="block w-full rounded-2xl border border-tinta/15 bg-white px-4 py-3 text-base outline-none ring-rio/40 focus:border-rio focus:ring-2"
          />
        </div>

        <div>
          <label
            htmlFor="fecha_nacimiento"
            className="mb-1 block text-sm font-medium text-noche"
          >
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            name="fecha_nacimiento"
            type="date"
            required
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
            Género
          </label>
          <select
            id="genero"
            name="genero"
            required
            defaultValue=""
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

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-tinta/15 bg-white p-4">
          <input
            type="checkbox"
            name="acepta_terminos"
            value="1"
            required
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border border-tinta/40 bg-white accent-rio focus:ring-2 focus:ring-rio/40"
          />
          <span className="text-sm leading-relaxed text-tinta/70">
            Soy mayor de 18 años y acepto los{" "}
            <Link
              href="/terminos"
              target="_blank"
              className="font-semibold text-rio underline"
            >
              Términos y Condiciones
            </Link>{" "}
            y la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-semibold text-rio underline"
            >
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        {searchParams.error ? (
          <p className="rounded-xl bg-arena/15 px-4 py-3 text-sm text-arena">
            {searchParams.error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
        >
          Crear cuenta
        </button>
      </form>
    </AuthCard>
  );
}

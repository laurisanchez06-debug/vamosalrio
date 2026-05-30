import Link from "next/link";
import AuthCard from "@/components/AuthCard";
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

        <p className="text-center text-xs leading-relaxed text-tinta/50">
          Al crear cuenta aceptás los{" "}
          <Link href="/terminos" className="font-medium text-rio">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="font-medium text-rio">
            Política de Privacidad
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}

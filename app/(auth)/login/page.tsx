import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { signInAction } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  return (
    <AuthCard
      logo
      titulo="Entrar"
      subtitulo="Bienvenido de vuelta a vamosalrio."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/registro" className="font-semibold text-rio">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form action={signInAction} className="space-y-4">
        <input
          type="hidden"
          name="redirect"
          value={searchParams.redirect ?? "/feed"}
        />
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
            autoComplete="current-password"
            placeholder="Tu contraseña"
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
          Entrar
        </button>

        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-tinta/60 hover:text-rio"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

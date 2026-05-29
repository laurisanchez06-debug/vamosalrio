import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-crema">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 60%), radial-gradient(80% 50% at 100% 100%, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 60%)",
        }}
      />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <header className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-rio text-crema">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
              <path d="M3 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-noche">
            vamosalrio
          </span>
        </header>

        <section className="mt-14 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-arena/15 px-3 py-1 text-xs font-medium text-arena">
            <span className="h-1.5 w-1.5 rounded-full bg-arena" />
            Verano en Rosario
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-noche sm:text-5xl">
            Encontrá tu próxima tripulación.
          </h1>

          <p className="mt-5 text-pretty text-lg leading-relaxed text-tinta/70">
            Salidas al río con gente que ya sabés quién es.{" "}
            <span className="font-medium text-tinta">
              Sin grupo de WhatsApp.
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-3">
            <Link
              href="/registro"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/20 transition active:scale-[0.98]"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-tinta/15 bg-crema px-6 text-base font-semibold text-noche transition active:scale-[0.98]"
            >
              Explorar salidas
            </Link>
          </div>

          <ul className="mt-10 space-y-3 text-sm text-tinta/70">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rio" />
              Armás la salida y la gente se anota sola.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rio" />
              Sabés quién va antes de salir de casa.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rio" />
              Punto, horario y qué llevar — todo en un lugar.
            </li>
          </ul>
        </section>

        <footer className="mt-12 text-center text-xs text-tinta/40">
          Hecho en Rosario, junto al Paraná.
        </footer>
      </div>
    </main>
  );
}

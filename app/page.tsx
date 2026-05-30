import Link from "next/link";

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-rio text-crema">
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
      </span>
      <span className="text-lg font-semibold tracking-tight text-noche">
        vamosalrio
      </span>
    </span>
  );
}

const PASOS = [
  {
    titulo: "Creá o sumate a una salida",
    texto: "Armá la tuya en un minuto o pedí sumarte a la de alguien más.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    titulo: "El host confirma la tripulación",
    texto: "Cada uno se presenta y el organizador elige con quién sale.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M16 11l2 2 4-4" />
        <circle cx="9" cy="8" r="4" />
        <path d="M3 20c0-3.3 2.7-6 6-6 1.5 0 2.9.6 4 1.5" />
      </svg>
    ),
  },
  {
    titulo: "Al río, con gente que ya sabés quién es",
    texto: "Punto, horario y qué llevar, todo en un lugar. Sin grupo de WhatsApp.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
        <path d="M5 13V6a1 1 0 0 1 1-1h6l5 4v4" />
        <path d="M12 5V2" />
      </svg>
    ),
  },
];

const CONFIANZA = [
  {
    titulo: "Aprobación del host",
    texto: "Nadie se sube sin que el organizador lo confirme. Vos elegís tu tripulación.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    titulo: "Calificaciones bidireccionales",
    texto: "Después de cada salida, host e invitados se califican. La buena onda suma reputación.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z" />
      </svg>
    ),
  },
  {
    titulo: "Perfiles verificados",
    texto: "Cada persona arma su perfil con foto, presentación e intereses. Sabés con quién vas antes de salir.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

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

      <div className="mx-auto max-w-md px-6 pb-12 pt-12">
        {/* ── Header ───────────────────────────────────────────── */}
        <header>
          <Logo />
        </header>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-arena/15 px-3 py-1 text-xs font-medium text-arena">
            <span className="h-1.5 w-1.5 rounded-full bg-arena" />
            Verano en Rosario
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-noche sm:text-5xl">
            Encontrá tu próxima tripulación.
          </h1>

          <p className="mt-5 text-pretty text-lg leading-relaxed text-tinta/70">
            Salidas al río con gente que ya sabés quién es.{" "}
            <span className="font-medium text-tinta">Sin grupo de WhatsApp.</span>
          </p>

          <div className="mt-9 flex flex-col gap-3">
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
        </section>

        {/* ── Cómo funciona ────────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-tinta/40">
            Cómo funciona
          </h2>
          <ol className="mt-4 space-y-3">
            {PASOS.map((paso, i) => (
              <li
                key={paso.titulo}
                className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm"
              >
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rio/10 text-rio">
                  {paso.icon}
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rio text-[11px] font-bold text-crema">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug text-noche">
                    {paso.titulo}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-tinta/60">
                    {paso.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Confianza ────────────────────────────────────────── */}
        <section className="mt-16">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-noche">
            Salís tranquilo.
          </h2>
          <p className="mt-2 text-pretty text-tinta/60">
            El río se disfruta mejor cuando sabés con quién estás.
          </p>

          <ul className="mt-5 space-y-3">
            {CONFIANZA.map((punto) => (
              <li
                key={punto.titulo}
                className="flex items-start gap-3 rounded-2xl border border-tinta/10 bg-white/60 p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-noche/5 text-noche">
                  {punto.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-noche">
                    {punto.titulo}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-tinta/60">
                    {punto.texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA final ────────────────────────────────────────── */}
        <section className="mt-16 rounded-3xl bg-noche px-6 py-8 text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-crema">
            ¿Listo para salir al río?
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-pretty text-sm leading-relaxed text-crema/70">
            Creá tu cuenta y armá tu primera salida hoy. Es gratis.
          </p>
          <Link
            href="/registro"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rio px-6 text-base font-semibold text-crema shadow-sm shadow-rio/30 transition active:scale-[0.98]"
          >
            Crear cuenta
          </Link>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mt-12 border-t border-tinta/10 pt-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-tinta/60">
            <Link href="/terminos" className="hover:text-rio">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-rio">
              Privacidad
            </Link>
            <a href="mailto:hola@vamosalrio.com.ar" className="hover:text-rio">
              Contacto
            </a>
          </nav>
          <p className="mt-4 text-center text-xs text-tinta/40">
            Hecho en Rosario, junto al Paraná. · © 2026 vamosalrio
          </p>
        </footer>
      </div>
    </main>
  );
}

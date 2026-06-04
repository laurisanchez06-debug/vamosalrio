import Image from "next/image";
import Link from "next/link";

/* ── Marca ──────────────────────────────────────────────────────────────── */

function Logo() {
  // Header sobre fondo azul: isotipo (pin) + wordmark tipeado en blanco.
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/vamosalrio_isotipo.png"
        alt=""
        aria-hidden
        width={40}
        height={40}
        priority
        className="h-10 w-auto"
      />
      <span className="text-xl font-bold tracking-tight text-crema">
        vamosalrio
      </span>
    </span>
  );
}

/* Ola divisoria: transiciona de una sección a la de abajo (color = fill). */
function Ola({ fill, className = "" }: { fill: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={`block h-[56px] w-full sm:h-[90px] ${className}`}
      style={{ fill }}
    >
      <path d="M0,64 C240,118 420,8 720,44 C1000,78 1200,26 1440,70 L1440,120 L0,120 Z" />
    </svg>
  );
}

/* ── Datos ──────────────────────────────────────────────────────────────── */

const PASOS = [
  {
    n: "1",
    titulo: "Creá o sumate a una salida",
    texto:
      "Armá la tuya en un minuto (fecha, punto, qué llevar) o pedí sumarte a la de otro con una presentación.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    n: "2",
    titulo: "El host confirma la tripulación",
    texto:
      "El organizador ve quién quiere ir, lee su presentación y elige con quién sale. Nadie se sube sin su OK.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M15 11l2 2 4-4" />
        <circle cx="9" cy="8" r="4" />
        <path d="M3 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4.1 1.6" />
      </svg>
    ),
  },
  {
    n: "3",
    titulo: "Al río, y después se califican",
    texto:
      "Punto, horario y costos compartidos, todo en un lugar. Al volver, host e invitados se califican.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
        <path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" />
        <path d="M5 13V6a1 1 0 0 1 1-1h6l5 4v4" />
        <path d="M12 5V2" />
      </svg>
    ),
  },
];

const TIPOS = [
  { emoji: "🚤", label: "Lancha / paseo" },
  { emoji: "🎣", label: "Pesca" },
  { emoji: "🛶", label: "Kayak / remo" },
  { emoji: "🏖️", label: "Playa / isla" },
  { emoji: "🔥", label: "Asado en isla" },
  { emoji: "🏄", label: "Deportes náuticos" },
];

const CONFIANZA = [
  {
    titulo: "Perfiles reales",
    texto:
      "Foto, presentación e Instagram. Mirás quién es cada uno antes de salir.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    titulo: "El host elige su tripulación",
    texto:
      "Cada salida la arma alguien que decide a quién suma. No es un grupo abierto.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    titulo: "Calificaciones bidireccionales",
    texto:
      "Después de cada salida, host e invitados se puntúan. La buena onda construye reputación.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z" />
      </svg>
    ),
  },
  {
    titulo: "Badge Capitán",
    texto:
      "Quienes organizan seguido y mantienen buena reputación se ganan el ⚓ Capitán.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

const CAPTURAS = [
  { archivo: "/landing/feed.png", titulo: "El feed", sub: "Salidas abiertas cerca tuyo" },
  { archivo: "/landing/salida.png", titulo: "La salida", sub: "Punto en el mapa, costos, tripulación" },
  { archivo: "/landing/perfil.png", titulo: "El perfil", sub: "Reputación, referencias y Capitán" },
];

/* ── Página ─────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <main className="bg-crema text-tinta">
      {/* ═══ 1. HERO ═══════════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden text-crema">
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{
            background:
              "linear-gradient(160deg, #0C4A6E 0%, #0b5b8a 45%, #0EA5E9 100%)",
          }}
        />
        {/* sol ámbar */}
        <div
          aria-hidden
          className="absolute right-4 top-8 -z-10 h-40 w-40 sm:right-24 sm:top-14 sm:h-56 sm:w-56"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.95) 0%, rgba(245,158,11,0.55) 42%, rgba(245,158,11,0) 70%)",
          }}
        />

        <div className="mx-auto max-w-5xl px-6 pb-28 pt-16 sm:pb-36 sm:pt-20">
          <header className="flex items-center justify-between gap-4">
            <Logo />
            <Link
              href="/login"
              className="text-sm font-semibold text-crema/90 transition hover:text-crema"
            >
              Iniciar sesión
            </Link>
          </header>

          <div className="mt-16 max-w-2xl sm:mt-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-crema/15 px-3 py-1 text-xs font-medium text-crema ring-1 ring-inset ring-crema/20 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-arena" />
              Salidas al río · todo el año
            </span>

            <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              Encontrá tu próxima tripulación.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-crema/85 sm:text-xl">
              Un paseo en lancha, un día de playa, pesca o kayak. Salidas al
              río con gente que ya sabés quién es. Armás la tuya o te sumás a la
              de otro, ves quién va antes de salir, y se califican después.{" "}
              <span className="font-semibold text-crema">
                Sin grupo de WhatsApp.
              </span>
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex h-13 items-center justify-center rounded-2xl bg-arena px-7 py-3.5 text-base font-semibold text-noche shadow-lg shadow-arena/25 transition hover:brightness-105 active:scale-[0.98]"
              >
                Crear cuenta
              </Link>
              <Link
                href="/feed"
                className="inline-flex h-13 items-center justify-center rounded-2xl border border-crema/30 bg-crema/10 px-7 py-3.5 text-base font-semibold text-crema backdrop-blur transition hover:bg-crema/20 active:scale-[0.98]"
              >
                Explorar salidas
              </Link>
            </div>
          </div>
        </div>

        <Ola fill="#FBFAF7" className="absolute inset-x-0 bottom-0" />
      </section>

      {/* ═══ 2. EL PROBLEMA ════════════════════════════════════════════════ */}
      <section className="bg-crema">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-arena">
            El problema de siempre
          </span>
          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-noche sm:text-5xl">
            Se viene el finde y querés ir al río.
          </h2>
          <div className="mt-6 max-w-3xl text-pretty text-lg leading-relaxed text-tinta/70">
            <p>
              Coordinar es un quilombo: los grupos de WhatsApp se pierden, los
              planes se caen, y nunca sabés bien con quién vas a terminar.{" "}
              <span className="font-semibold text-tinta">
                Te conectamos con la gente antes de salir
              </span>{" "}
              para ir en lancha, a la playa, de pesca o de camping.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 3. CÓMO FUNCIONA ══════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rio">
              Cómo funciona
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-noche sm:text-4xl">
              De la idea al agua, en tres pasos.
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {PASOS.map((paso) => (
              <li
                key={paso.n}
                className="relative rounded-3xl border border-tinta/10 bg-crema p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rio/10 text-rio">
                    {paso.icon}
                  </span>
                  <span className="text-5xl font-bold text-tinta/10">
                    {paso.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-noche">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-pretty leading-relaxed text-tinta/65">
                  {paso.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ 4. PARA QUÉ SALÍS ═════════════════════════════════════════════ */}
      <section className="bg-crema">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-arena">
              Para qué salís
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-noche sm:text-4xl">
              Cada salida tiene su onda.
            </h2>
            <p className="mt-3 text-pretty text-lg text-tinta/65">
              Elegís el tipo cuando armás la tuya, y filtrás por el que te copa
              en el feed.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TIPOS.map((t, i) => (
              <li
                key={t.label}
                className="group relative overflow-hidden rounded-3xl border border-tinta/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  aria-hidden
                  className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-70 transition group-hover:scale-110"
                  style={{
                    background:
                      i % 2 === 0
                        ? "radial-gradient(circle, rgba(14,165,233,0.16) 0%, rgba(14,165,233,0) 70%)"
                        : "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 70%)",
                  }}
                />
                <span className="text-4xl">{t.emoji}</span>
                <h3 className="mt-4 font-semibold text-noche">{t.label}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ 5. CONFIANZA (el corazón) ═════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden text-crema">
        <Ola fill="#0C4A6E" className="rotate-180" />
        <div
          aria-hidden
          className="absolute inset-0 -z-20"
          style={{ background: "#0C4A6E" }}
        />
        <div
          aria-hidden
          className="absolute -left-20 top-1/3 -z-10 h-72 w-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(14,165,233,0.35) 0%, rgba(14,165,233,0) 70%)",
          }}
        />

        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-arena">
              Confianza
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              El río con desconocidos da cosa. Por eso lo armamos al revés.
            </h2>
            <p className="mt-5 text-pretty text-lg leading-relaxed text-crema/80">
              Acá no subís a un bote con cualquiera. Sabés quién es cada uno,
              quién organiza, y cómo le fue a la gente en sus salidas anteriores.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {CONFIANZA.map((c) => (
              <li
                key={c.titulo}
                className="flex items-start gap-4 rounded-3xl bg-crema/5 p-6 ring-1 ring-inset ring-crema/10"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rio/20 text-crema">
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-crema">
                    {c.titulo}
                  </h3>
                  <p className="mt-1 text-pretty leading-relaxed text-crema/70">
                    {c.texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Ola fill="#FBFAF7" className="absolute inset-x-0 bottom-0" />
      </section>

      {/* ═══ 6. ASÍ SE VE POR DENTRO ═══════════════════════════════════════ */}
      <section className="bg-crema">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rio">
              Así se ve por dentro
            </span>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-noche sm:text-4xl">
              Simple, en el teléfono, mientras tomás unos mates.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {CAPTURAS.map((c) => (
              <figure key={c.archivo}>
                <Image
                  src={c.archivo}
                  alt={c.titulo}
                  width={393}
                  height={780}
                  className="mx-auto h-auto w-full max-w-[260px] rounded-[2rem] shadow-xl"
                />
                <figcaption className="mt-4 text-center">
                  <span className="block text-sm font-semibold text-noche">
                    {c.titulo}
                  </span>
                  <span className="mt-0.5 block text-sm text-tinta/55">
                    {c.sub}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. CTA FINAL ══════════════════════════════════════════════════ */}
      <section className="bg-crema px-6 pb-20 sm:pb-28">
        <div
          className="relative isolate mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-crema sm:py-20"
          style={{
            background:
              "linear-gradient(135deg, #0C4A6E 0%, #0EA5E9 70%, #2bb6f2 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute -right-10 -top-10 -z-10 h-44 w-44 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0) 70%)",
            }}
          />
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            ¿Listo para salir al río?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-lg leading-relaxed text-crema/85">
            Creá tu cuenta y armá tu primera salida hoy. Sumás tu tripulación en
            minutos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/registro"
              className="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-arena px-8 py-3.5 text-base font-semibold text-noche shadow-lg shadow-arena/25 transition hover:brightness-105 active:scale-[0.98] sm:w-auto"
            >
              Crear cuenta
            </Link>
            <span className="text-sm font-medium text-crema/75">
              Gratis · sin tarjeta
            </span>
          </div>
        </div>
      </section>

      {/* ═══ 8. FOOTER ═════════════════════════════════════════════════════ */}
      <footer className="bg-crema">
        <div className="mx-auto max-w-6xl border-t border-tinta/10 px-6 py-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Image
              src="/vamosalrio_logo_full.png"
              alt="vamosalrio"
              width={320}
              height={120}
              className="h-20 w-auto"
            />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-tinta/60">
              <Link href="/terminos" className="hover:text-rio">
                Términos
              </Link>
              <Link href="/privacidad" className="hover:text-rio">
                Privacidad
              </Link>
              <Link href="/contacto" className="hover:text-rio">
                Contacto
              </Link>
              <Link href="/ayuda" className="hover:text-rio">
                Ayuda
              </Link>
            </nav>
          </div>
          <p className="mt-6 text-xs text-tinta/40">
            Hecho en Rosario, junto al Paraná. · © 2026 vamosalrio · Kappla SRL
          </p>
        </div>
      </footer>
    </main>
  );
}

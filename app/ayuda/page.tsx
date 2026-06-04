import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ayuda · vamosalrio",
  description: "Preguntas frecuentes sobre vamosalrio: cómo crear salidas, sumarte, calificaciones, seguridad y soporte.",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "¿Qué es vamosalrio?",
    a: (
      <>
        Una app para encontrar o armar salidas al río con gente que ya sabés
        quién es.
      </>
    ),
  },
  {
    q: "¿Cómo creo una salida?",
    a: (
      <>
        Tocá “Crear”, elegí qué van a hacer, cuándo y dónde, y publicá.
      </>
    ),
  },
  {
    q: "¿Cómo me sumo a una salida?",
    a: (
      <>
        Buscá en el feed, entrá a la salida y pedí sumarte con una breve
        presentación. El host confirma.
      </>
    ),
  },
  {
    q: "¿Es gratis?",
    a: <>Sí, usar vamosalrio es gratis.</>,
  },
  {
    q: "¿Cómo funcionan las calificaciones?",
    a: (
      <>
        Después de cada salida, host e invitados se califican. Eso construye tu
        reputación.
      </>
    ),
  },
  {
    q: "¿Qué pasa si me bajo de una salida?",
    a: (
      <>
        Con más de 48hs de anticipación, sin penalidad. Con menos, se registra
        una cancelación de último momento en tu perfil.
      </>
    ),
  },
  {
    q: "¿Es seguro? ¿Verifican a los usuarios?",
    a: (
      <>
        No verificamos identidad. Mirá los perfiles, las referencias y tomá tus
        precauciones al encontrarte con alguien por primera vez.
      </>
    ),
  },
  {
    q: "¿Cómo contacto a soporte?",
    a: (
      <>
        Escribinos a{" "}
        <a
          href="mailto:comercial@kapplasrl.com"
          className="font-semibold text-rio"
        >
          comercial@kapplasrl.com
        </a>{" "}
        o desde la{" "}
        <Link href="/contacto" className="font-semibold text-rio">
          página de Contacto
        </Link>
        .
      </>
    ),
  },
];

export default function AyudaPage() {
  return (
    <main className="min-h-screen bg-crema">
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-noche">Ayuda</h1>
          <p className="mt-2 text-tinta/70">
            Las preguntas más frecuentes sobre vamosalrio.
          </p>
        </header>

        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white px-4 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-base font-semibold text-noche [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rio/10 text-rio transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pb-4 text-sm leading-relaxed text-tinta/75">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-rio/20 bg-rio/5 p-5 text-sm text-tinta/75">
          ¿No encontraste lo que buscabas? Escribinos a{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>{" "}
          o entrá a{" "}
          <Link href="/contacto" className="font-semibold text-rio">
            Contacto
          </Link>
          .
        </div>

        <footer className="mt-14 border-t border-tinta/10 pt-6 text-sm text-tinta/60">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
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
          <p className="mt-4 text-xs text-tinta/40">
            © 2026 vamosalrio · Kappla SRL
          </p>
        </footer>
      </div>
    </main>
  );
}

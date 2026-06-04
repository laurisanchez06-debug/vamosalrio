import Link from "next/link";

type Props = {
  titulo: string;
  actualizado?: string;
  borrador?: boolean;
  children: React.ReactNode;
};

export default function LegalShell({ titulo, actualizado, borrador, children }: Props) {
  return (
    <main className="min-h-screen bg-crema">
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver al inicio
        </Link>

        {borrador ? (
          <p className="mt-6 rounded-2xl border border-arena/30 bg-arena/10 px-4 py-3 text-sm font-semibold text-arena">
            BORRADOR: pendiente de revisión legal.
          </p>
        ) : null}

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-noche">{titulo}</h1>
          {actualizado ? (
            <p className="mt-2 text-sm text-tinta/50">{actualizado}</p>
          ) : null}
        </header>

        <div className="mt-8 space-y-8">{children}</div>

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
          <p className="mt-4 text-xs text-tinta/40">© 2026 vamosalrio · Kappla SRL</p>
        </footer>
      </div>
    </main>
  );
}

export function Clausula({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-noche">
        {numero}. {titulo}
      </h2>
      <div className="mt-2 space-y-2 text-pretty leading-relaxed text-tinta/75">
        {children}
      </div>
    </section>
  );
}

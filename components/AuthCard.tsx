import Image from "next/image";
import Link from "next/link";

type Props = {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  logo?: boolean;
};

export default function AuthCard({
  titulo,
  subtitulo,
  children,
  footer,
  logo,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-crema">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -10%, rgba(14,165,233,0.16) 0%, rgba(14,165,233,0) 60%)",
        }}
      />
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-tinta/60"
        >
          <span aria-hidden>←</span> Volver
        </Link>

        {logo ? (
          <Image
            src="/vamosalrio_logo_full.png"
            alt="vamosalrio"
            width={1007}
            height={897}
            priority
            className="mx-auto mt-10 mb-8 block h-28 w-auto max-w-[60%] object-contain"
          />
        ) : null}

        <div className={logo ? "" : "mt-10"}>
          <h1 className="text-3xl font-bold tracking-tight text-noche">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="mt-2 text-tinta/70">{subtitulo}</p>
          ) : null}
        </div>

        <div className="mt-8 flex-1">{children}</div>

        {footer ? (
          <div className="mt-8 text-center text-sm text-tinta/70">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

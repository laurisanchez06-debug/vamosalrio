import { categoriaEmoji, categoriaLabel } from "@/lib/format";

// Portada de una salida: si hay foto cargada, la muestra; si no, dibuja un
// fallback de marca (degradado azul río → azul profundo) con el ícono grande
// del tipo de salida y su nombre. Nunca deja un hueco blanco.
export default function PortadaCover({
  imagenPortada,
  categoria,
  tipoOtro,
  titulo,
  className = "",
  iconClassName = "text-6xl",
  showLabel = true,
}: {
  imagenPortada: string | null | undefined;
  categoria: string | null | undefined;
  tipoOtro?: string | null;
  titulo?: string | null;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}) {
  if (imagenPortada) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imagenPortada}
        alt={titulo ? `Portada de ${titulo}` : "Portada de la salida"}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const label = categoriaLabel(categoria, tipoOtro);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-rio to-noche text-crema ${className}`}
    >
      <span className={iconClassName} aria-hidden>
        {categoriaEmoji(categoria)}
      </span>
      {showLabel && label ? (
        <span className="text-sm font-semibold uppercase tracking-wide text-crema/90">
          {label}
        </span>
      ) : null}
    </div>
  );
}

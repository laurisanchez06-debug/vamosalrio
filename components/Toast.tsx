"use client";

type Props = {
  mensaje: string;
  tipo?: "info" | "error";
};

export default function Toast({ mensaje, tipo = "info" }: Props) {
  const cls =
    tipo === "error"
      ? "bg-arena text-crema"
      : "bg-noche text-crema";
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6"
    >
      <div
        className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ${cls}`}
      >
        {mensaje}
      </div>
    </div>
  );
}

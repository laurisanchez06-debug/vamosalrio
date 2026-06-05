"use client";

import { useEffect, useRef, useState } from "react";

function initials(name?: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function IconoCamara() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

// Campo de foto de perfil: oculta el <input type=file> nativo (feo) y pone
// encima un botón propio de marca. La imagen elegida se comprime en el browser
// (igual que la portada de salida) y se vuelve a inyectar en el input oculto
// para que la server action la suba ya liviana, sin cambiar el flujo del form.
export default function FotoPerfilField({
  nombre,
  fotoUrl,
}: {
  nombre: string | null;
  fotoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vista = preview ?? fotoUrl;
  const tieneFoto = !!vista;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\//i.test(file.type)) {
      setError("Elegí una imagen.");
      return;
    }

    setError(null);
    setProcesando(true);
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;
      const comprimida = await imageCompression(file, {
        maxWidthOrHeight: 720,
        maxSizeMB: 0.7,
        useWebWorker: true,
        fileType: "image/webp",
      });
      // Renombramos a .webp para que coincida con el contentType (la server
      // action deriva la extensión del nombre del archivo).
      const finalFile = new File([comprimida], "avatar.webp", {
        type: "image/webp",
      });
      // Reinyectamos el archivo comprimido en el input que envía el form.
      const dt = new DataTransfer();
      dt.items.add(finalFile);
      if (inputRef.current) inputRef.current.files = dt.files;

      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(finalFile));
    } catch {
      setError("No pudimos procesar la imagen. Probá con otra.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-noche">
        Foto de perfil
      </span>

      <input
        ref={inputRef}
        id="foto"
        name="foto"
        type="file"
        accept="image/*"
        onChange={onChange}
        className="sr-only"
      />

      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-rio text-xl font-bold text-crema ring-2 ring-white">
          {tieneFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vista!}
              alt={nombre ?? "Perfil"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initials(nombre)}</span>
          )}
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={procesando}
            className="inline-flex items-center gap-2 rounded-2xl border border-rio/30 bg-rio/5 px-4 py-2.5 text-sm font-semibold text-rio transition active:scale-[0.98] disabled:opacity-60"
          >
            {procesando ? (
              "Procesando…"
            ) : (
              <>
                <IconoCamara />
                {tieneFoto ? "Cambiar imagen" : "Subir imagen"}
              </>
            )}
          </button>
          <p className="mt-1.5 text-xs text-tinta/50">
            {preview
              ? "Lista para guardar."
              : "Sacá una foto o elegila de tu galería."}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-arena">{error}</p>
      ) : null}
    </div>
  );
}

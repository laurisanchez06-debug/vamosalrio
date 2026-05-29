import NuevaSalidaForm from "./NuevaSalidaForm";

export default function NuevaSalidaPage() {
  return (
    <>
      <header className="px-6 pt-10">
        <h1 className="text-3xl font-bold tracking-tight text-noche">
          Nueva salida
        </h1>
        <p className="mt-2 text-tinta/70">
          Armá los detalles y publicala. Después aparece en el feed.
        </p>
      </header>

      <NuevaSalidaForm />
    </>
  );
}

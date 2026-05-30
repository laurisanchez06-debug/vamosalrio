import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NuevaSalidaForm from "./NuevaSalidaForm";

export default async function NuevaSalidaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/salida/nueva")}`);
  }

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

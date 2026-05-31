import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function cerrarSesion() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default function SuspendidoPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-crema px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-2xl">
          🚫
        </div>
        <h1 className="mt-4 text-2xl font-bold text-noche">
          Tu cuenta está suspendida
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-tinta/70">
          Un administrador bloqueó el acceso a tu cuenta. Si creés que es un
          error, escribinos a{" "}
          <a
            href="mailto:comercial@kapplasrl.com"
            className="font-semibold text-rio"
          >
            comercial@kapplasrl.com
          </a>
          .
        </p>
        <form action={cerrarSesion} className="mt-6">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-noche px-6 text-base font-semibold text-crema active:scale-[0.98]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}

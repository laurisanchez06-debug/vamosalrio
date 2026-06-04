import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import RealtimeSolicitudes from "@/components/RealtimeSolicitudes";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usuario bloqueado: lo sacamos de la app. El feed sigue siendo público para
  // anónimos; esto solo aplica a sesiones logueadas y bloqueadas.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let noLeidas = 0;
  let hostSalidaIds: string[] = [];
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("bloqueado, fecha_nacimiento, onboarding_completado")
      .eq("id", user.id)
      .maybeSingle();
    if (prof?.bloqueado) redirect("/suspendido");
    // Cuentas existentes sin fecha de nacimiento: completar perfil (barrera +18).
    if (prof && !prof.fecha_nacimiento) redirect("/completar-perfil");
    // Primer ingreso: onboarding de bienvenida (salteable).
    if (prof && !prof.onboarding_completado) redirect("/bienvenida");

    // Salidas donde el usuario es host: alimentan el realtime de solicitudes.
    const { data: misSalidas } = await supabase
      .from("salidas")
      .select("id")
      .eq("host_id", user.id);
    hostSalidaIds = (misSalidas ?? []).map((s) => s.id);

    // Badge de la campana = notificaciones sin leer. Si la tabla todavía no
    // existe (0022 sin aplicar), count es null → 0, sin romper la app.
    const { count } = await supabase
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("leida", false);
    noLeidas = count ?? 0;
  }

  return (
    <div className="min-h-screen bg-crema">
      <main className="mx-auto max-w-md pb-24">{children}</main>
      {user && hostSalidaIds.length > 0 ? (
        <RealtimeSolicitudes userId={user.id} salidaIds={hostSalidaIds} />
      ) : null}
      <ServiceWorkerRegister />
      <PwaInstallPrompt />
      <BottomNav noLeidas={noLeidas} />
    </div>
  );
}

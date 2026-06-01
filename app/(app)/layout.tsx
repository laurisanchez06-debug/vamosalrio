import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

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
  }

  return (
    <div className="min-h-screen bg-crema">
      <main className="mx-auto max-w-md pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}

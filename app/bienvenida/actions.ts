"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Marca el onboarding como visto y manda al destino elegido.
export async function completarOnboardingAction(destino: "feed" | "perfil") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("profiles")
    .update({ onboarding_completado: true })
    .eq("id", user!.id);

  redirect(destino === "perfil" ? "/completar-perfil" : "/feed");
}

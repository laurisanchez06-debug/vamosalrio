import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Onboarding from "./Onboarding";

export const dynamic = "force-dynamic";

export default async function BienvenidaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("onboarding_completado")
    .eq("id", user!.id)
    .maybeSingle();

  // Ya lo vio: directo al feed.
  if (prof?.onboarding_completado) {
    redirect("/feed");
  }

  return <Onboarding />;
}

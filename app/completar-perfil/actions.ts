"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AVATARS_BUCKET,
  createAdminClient,
  ensureAvatarsBucket,
} from "@/lib/supabase/admin";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeInstagram(handle: string) {
  if (!handle) return null;
  return handle.replace(/^@+/, "").trim() || null;
}

export async function completarPerfilAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nombre = clean(formData.get("nombre"));
  const bio = clean(formData.get("bio")).slice(0, 200);
  const instagram = normalizeInstagram(clean(formData.get("instagram_handle")));
  const foto = formData.get("foto");

  if (!nombre) {
    redirect(
      `/completar-perfil?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  let fotoUrl: string | null = null;

  if (foto instanceof File && foto.size > 0) {
    try {
      await ensureAvatarsBucket();
      const admin = createAdminClient();
      const ext = (foto.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const arrayBuffer = await foto.arrayBuffer();
      const { error: uploadError } = await admin.storage
        .from(AVATARS_BUCKET)
        .upload(path, Buffer.from(arrayBuffer), {
          contentType: foto.type || "image/jpeg",
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data: publicUrl } = admin.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(path);
      fotoUrl = publicUrl.publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos subir la foto.";
      redirect(`/completar-perfil?error=${encodeURIComponent(msg)}`);
    }
  }

  const { error: upsertError } = await supabase
    .from("profiles")
    .update({
      nombre,
      bio: bio || null,
      instagram_handle: instagram,
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    })
    .eq("id", user!.id);

  if (upsertError) {
    redirect(
      `/completar-perfil?error=${encodeURIComponent(upsertError.message)}`,
    );
  }

  redirect("/feed");
}

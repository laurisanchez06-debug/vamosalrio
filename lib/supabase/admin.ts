import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin.",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

const AVATARS_BUCKET = "avatars";

export async function ensureAvatarsBucket() {
  const admin = createAdminClient();
  const { error } = await admin.storage.createBucket(AVATARS_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

export { AVATARS_BUCKET };

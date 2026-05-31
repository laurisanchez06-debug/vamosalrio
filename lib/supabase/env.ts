// Lee y sanea las variables de entorno de Supabase.
//
// En Vercel, pegar un valor en el dashboard a veces deja un salto de línea o
// espacios alrededor. Ese carácter invisible rompe el fetch a la API de auth
// (URL inválida / header con valor inválido) y hace que `signUp` /
// `signInWithPassword` TIREN una excepción no manejada → "Application error:
// a server-side exception". Curiosamente las páginas que solo hacen
// `getUser()` sin sesión no fallan, porque ahí supabase-js no hace red.
// Por las dudas, limpiamos SIEMPRE el valor antes de usarlo.
function sanitize(value: string | undefined): string {
  // Saca espacios/saltos de línea y comillas que a veces quedan al pegar.
  return (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function supabaseUrl(): string {
  let url = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  // En el deploy la URL llegaba SIN esquema (ej. "xxx.supabase.co"), y
  // supabase-js tira "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
  // al construir el cliente → 500 al crear cuenta / iniciar sesión. Si falta
  // el esquema, lo agregamos para que el cliente se construya igual.
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }
  return url;
}

export function supabaseAnonKey(): string {
  return sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceRoleKey(): string {
  return sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

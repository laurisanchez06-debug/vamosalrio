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
  return (value ?? "").trim();
}

export function supabaseUrl(): string {
  return sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseServiceRoleKey(): string {
  return sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

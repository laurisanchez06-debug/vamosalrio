import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

// Middleware de sesión de @supabase/ssr: refresca el token en cada request y
// reescribe las cookies en la respuesta. Sin esto, los Server Components no
// pueden persistir el token refrescado (setAll es no-op en render), la sesión
// se vence sola y aparecen estados de auth inconsistentes durante el flujo.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: getUser() valida el token contra el servidor de Auth y dispara
  // el refresh si hace falta. No metas lógica entre createServerClient y acá.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Corre en todo, menos assets estáticos y la carpeta de imágenes públicas.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

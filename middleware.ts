import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Middleware Edge-safe y defensivo.
// - NO importa nada del lado cliente/mapas ni APIs de Node (solo next/server
//   y @supabase/ssr, ambos compatibles con el runtime Edge).
// - Si faltan las envs de Supabase, no asume nada: deja pasar.
// - TODA la lógica va en try/catch: ante cualquier error devuelve next(),
//   así un fallo del middleware nunca voltea el sitio (las páginas igual
//   validan auth del lado server).
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return response;
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Refresca la sesión si hace falta. No redirige: cada página corre su
    // propio chequeo de auth del lado server.
    await supabase.auth.getUser();

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Corre en todo salvo assets estáticos e íconos.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";

// ⚠️ Edge runtime: este archivo NO debe importar nada que arrastre módulos
// Node-only. En particular NO importamos @supabase/ssr ni supabase-js: su
// cadena transitiva (realtime-js / node-fetch) referencia `__dirname`, que no
// existe en Edge y revienta al CARGAR el módulo (antes de cualquier try/catch).
// Acá solo usamos `next/server` y leemos cookies del request.
//
// El middleware solo GATEA por presencia de la sesión (cookie de Supabase).
// La validación real del token la hace cada página server-side (getUser +
// redirect), así que esto es suficiente para la navegación.

const PUBLIC_PATHS = new Set(["/", "/login", "/registro", "/completar-perfil"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  // Detalle de salida es público (se comparte por WhatsApp/Instagram).
  // /salida/nueva queda protegida.
  if (pathname.startsWith("/salida/") && pathname !== "/salida/nueva") {
    return true;
  }
  return false;
}

// Supabase guarda la sesión en cookies tipo `sb-<ref>-auth-token` (puede venir
// chunkeada: `...auth-token.0`, `.1`). Con que exista alguna con valor alcanza.
function tieneSesion(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.includes("auth-token") &&
        !!c.value,
    );
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    if (!tieneSesion(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Un middleware nunca debe voltear el sitio.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

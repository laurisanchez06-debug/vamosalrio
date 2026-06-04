"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
  badgeKey?: "noLeidas";
};

const items: Item[] = [
  {
    href: "/feed",
    label: "Explorar",
    match: (p) => p === "/feed" || p.startsWith("/salida/") && p !== "/salida/nueva",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? "stroke-rio" : "stroke-tinta/60"}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/salida/nueva",
    label: "Crear",
    match: (p) => p === "/salida/nueva",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? "stroke-rio" : "stroke-tinta/60"}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/notificaciones",
    label: "Avisos",
    badgeKey: "noLeidas",
    match: (p) => p.startsWith("/notificaciones"),
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? "stroke-rio" : "stroke-tinta/60"}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    href: "/mis-salidas",
    label: "Mis salidas",
    match: (p) => p.startsWith("/mis-salidas"),
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? "stroke-rio" : "stroke-tinta/60"}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </svg>
    ),
  },
  {
    href: "/perfil",
    label: "Perfil",
    match: (p) => p.startsWith("/perfil"),
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${active ? "stroke-rio" : "stroke-tinta/60"}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

export default function BottomNav({
  noLeidas = 0,
}: {
  noLeidas?: number;
}) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-tinta/10 bg-crema/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const badge = item.badgeKey === "noLeidas" ? noLeidas : 0;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 py-2 text-[11px]"
              >
                <span className="relative">
                  {item.icon(active)}
                  {badge > 0 ? (
                    <span
                      aria-label={`${badge} notificaciones sin leer`}
                      className="absolute -right-2 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`leading-tight ${
                    active ? "font-semibold text-rio" : "text-tinta/60"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

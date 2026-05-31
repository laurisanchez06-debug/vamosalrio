"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/salidas", label: "Salidas" },
  { href: "/admin/reportes", label: "Reportes" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto sm:flex-col sm:gap-1 sm:overflow-visible">
      {LINKS.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-rio text-crema"
                : "text-tinta/70 hover:bg-white hover:text-noche"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

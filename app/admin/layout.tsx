import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "./_lib";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/feed");

  return (
    <div className="min-h-screen bg-crema">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rio">
              Panel
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-noche">
              Administración
            </h1>
          </div>
          <Link href="/feed" className="text-sm font-medium text-tinta/60 hover:text-rio">
            ← Volver a la app
          </Link>
        </header>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <aside className="sm:w-48 sm:shrink-0">
            <AdminSidebar />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

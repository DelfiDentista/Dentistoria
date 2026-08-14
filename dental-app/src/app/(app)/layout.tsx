import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth-actions";

const nav = [
  { href: "/patients", label: "Pacientes", icon: "👥" },
  { href: "/calendar", label: "Calendario", icon: "🗓️" },
  { href: "/appointments", label: "Turnos", icon: "📅" },
  { href: "/cash", label: "Caja", icon: "💵" },
  { href: "/import", label: "Importar", icon: "⬆️" },
  { href: "/catalogs", label: "Catálogos", icon: "📚" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold text-slate-900">Historia Clínica</p>
          <p className="text-xs text-slate-500">Consultorio odontológico</p>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-3">
          <p className="mb-2 truncate px-3 text-xs text-slate-500">{user?.email}</p>
          <form action={signOut}>
            <button className="btn-ghost w-full text-sm">Cerrar sesión</button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        {/* Top header (mobile) */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-bold">Historia Clínica</span>
          <form action={signOut}>
            <button className="text-sm text-slate-500">Salir</button>
          </form>
        </header>
        <main className="mx-auto max-w-5xl p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-600"
          >
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

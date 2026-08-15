import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, LogOut, Users } from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
] as const;

export function AppShell({
  titulo,
  descripcion,
  acciones,
  children,
}: {
  titulo: string;
  descripcion: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 md:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight text-sidebar-foreground">
              RENTELO FACIL
            </p>
            <p className="text-xs text-muted-foreground">Centro de redes</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground",
              }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">Automatización activa</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Contenido, publicación e informe se ejecutan todos los días a las 8:00 a.m.
            </p>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              await navigate({ to: "/auth" });
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <h1 className="font-display text-xl font-bold sm:text-2xl">{titulo}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>
            </div>
            {acciones ? <div className="flex flex-wrap gap-2">{acciones}</div> : null}
          </div>
          <nav className="flex gap-1 border-t border-border px-4 py-2 md:hidden">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function PaginaLegal({
  titulo,
  descripcion,
  actualizado,
  children,
}: {
  titulo: string;
  descripcion: string;
  actualizado: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Centro de gestión de redes
            </p>
            <p className="text-xs text-muted-foreground">
              PANAMA REAL ESTATE · GESTIONES COMERCIALES
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{titulo}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{descripcion}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Última actualización: {actualizado}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>

        <nav className="mt-12 flex flex-wrap gap-4 border-t border-border/60 pt-6 text-xs">
          <Link to="/privacy" className="text-primary hover:underline">
            Política de privacidad
          </Link>
          <Link to="/terms" className="text-primary hover:underline">
            Términos de uso
          </Link>
          <Link to="/data-deletion" className="text-primary hover:underline">
            Eliminación de datos
          </Link>
        </nav>
      </main>
    </div>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}

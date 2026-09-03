import { useQuery } from "@tanstack/react-query";
import { BellRing, Copy, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { leadsQuery, plantillasQuery, tareasQuery } from "@/lib/queries";

const ETAPAS = [
  { clave: "nuevo", etiqueta: "Nuevos" },
  { clave: "seguimiento", etiqueta: "En seguimiento" },
  { clave: "calificado", etiqueta: "Calificados" },
  { clave: "cerrado", etiqueta: "Cerrados" },
  { clave: "perdido", etiqueta: "Perdidos" },
] as const;

export function Seguimiento() {
  const { empresaId } = useEmpresa();
  const { data: leads = [] } = useQuery(leadsQuery(empresaId));
  const { data: tareas = [] } = useQuery(tareasQuery(empresaId));
  const { data: plantillas = [] } = useQuery(plantillasQuery(empresaId));

  const pendientes = tareas.filter((t) => t.estado === "pendiente");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Target className="size-4 text-primary" /> Embudo de leads
        </h2>
        <div className="mt-4 space-y-2">
          {ETAPAS.map(({ clave, etiqueta }) => {
            const grupo = leads.filter((l) => l.etapa === clave);
            const valor = grupo.reduce((s, l) => s + Number(l.valor_estimado ?? 0), 0);
            return (
              <div
                key={clave}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
              >
                <span>{etiqueta}</span>
                <span className="font-semibold">
                  {grupo.length}
                  {valor > 0 ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ${valor.toLocaleString("es-PA")}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
        {leads.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Aún no hay leads registrados. Al calificar un mensaje de la bandeja se crea el lead con
            su etapa y responsable.
          </p>
        ) : null}
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <BellRing className="size-4 text-primary" /> Recordatorios de seguimiento
        </h2>
        {pendientes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay recordatorios pendientes para esta empresa.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {pendientes.slice(0, 8).map((t) => (
              <li key={t.id} className="py-2">
                <p className="font-medium">{t.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  Vence {new Date(t.vence_at).toLocaleString("es-PA")}
                  {t.colaboradores?.nombre ? ` · ${t.colaboradores.nombre}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="font-display text-lg font-bold">Plantillas de respuesta</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Copia la plantilla, edítala en el mensaje y envíala tú: nunca se envía automáticamente.
        </p>
        {plantillas.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Todavía no hay plantillas creadas para esta empresa.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {plantillas.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.categoria} · {p.red}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(p.contenido);
                      toast.success("Plantilla copiada");
                    }}
                  >
                    <Copy className="size-3.5" /> Copiar
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">{p.contenido}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

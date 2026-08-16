import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generarInforme } from "@/lib/marketing.functions";
import { useEmpresa } from "@/lib/empresa";
import { informesQuery } from "@/lib/queries";

export function Informe() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  const { data: informes = [] } = useQuery(informesQuery(empresaId));
  const generar = useServerFn(generarInforme);

  const mut = useMutation({
    mutationFn: () => generar({ data: { empresaId } }),
    onSuccess: () => {
      toast.success("Informe del día generado");
      void qc.invalidateQueries({ queryKey: ["informes", empresaId] });
    },
    onError: (e: Error) => toast.error("No se pudo generar el informe", { description: e.message }),
  });

  const ultimo = informes[0];

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <FileText className="size-5 text-primary" /> Informe diario de trabajo
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Se genera automáticamente cada noche con lo publicado, lo atendido y lo recomendado.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Generar informe de hoy
        </Button>
      </div>

      {!ultimo ? (
        <p className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay informes registrados.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {new Date(`${ultimo.fecha}T12:00:00`).toLocaleDateString("es-PA", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Mejor red: <span className="font-semibold capitalize text-foreground">{ultimo.mejor_red}</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">{ultimo.resumen}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metrica etiqueta="Publicadas" valor={ultimo.publicaciones_publicadas} />
            <Metrica etiqueta="Alcance" valor={ultimo.alcance_total} />
            <Metrica etiqueta="Mensajes" valor={`${ultimo.mensajes_atendidos}/${ultimo.mensajes_recibidos}`} />
            <Metrica etiqueta="Leads" valor={ultimo.leads_nuevos} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Lista titulo="Logros" items={ultimo.logros} />
            <Lista titulo="Recomendaciones" items={ultimo.recomendaciones} />
          </div>

          {informes.length > 1 ? (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Informes anteriores
              </p>
              <ul className="mt-2 space-y-1">
                {informes.slice(1, 6).map((i) => (
                  <li key={i.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.fecha}</span>
                    <span>
                      {i.publicaciones_publicadas} pub · {i.leads_nuevos} leads ·{" "}
                      {i.alcance_total.toLocaleString("es-PA")} alcance
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 font-display text-xl font-bold">
        {typeof valor === "number" ? valor.toLocaleString("es-PA") : valor}
      </p>
    </div>
  );
}

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-sm font-semibold">{titulo}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

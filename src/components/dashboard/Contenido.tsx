import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EstadoBadge, IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { nombrePilar } from "@/lib/estrategia";
import { generarContenido, publicarAhora } from "@/lib/marketing.functions";
import { publicacionesQuery } from "@/lib/queries";

function fechaLegible(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "long" });
}

export function Contenido() {
  const qc = useQueryClient();
  const { data: publicaciones = [] } = useQuery(publicacionesQuery);
  const generar = useServerFn(generarContenido);
  const publicar = useServerFn(publicarAhora);

  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["publicaciones"] });
    void qc.invalidateQueries({ queryKey: ["informes"] });
  };

  const generarMut = useMutation({
    mutationFn: (fecha?: string) => generar({ data: { fecha } }),
    onSuccess: (r) => {
      toast.success(r.mensaje, { description: `${r.creadas} piezas para ${r.fecha}` });
      refrescar();
    },
    onError: (e: Error) => toast.error("No se pudo generar el contenido", { description: e.message }),
  });

  const publicarMut = useMutation({
    mutationFn: () => publicar(),
    onSuccess: (r) => {
      toast.success("Cola procesada", {
        description: `${r.publicadas} publicadas · ${r.enCola} en espera de conexión`,
      });
      refrescar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marcarPublicado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("publicaciones")
        .update({ estado: "publicado", publicado_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refrescar,
    onError: (e: Error) => toast.error(e.message),
  });

  const hoy = new Date().toISOString().slice(0, 10);
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const proximas = publicaciones
    .filter((p) => p.fecha_programada >= hoy)
    .sort((a, b) =>
      `${a.fecha_programada}${a.hora_programada}`.localeCompare(
        `${b.fecha_programada}${b.hora_programada}`,
      ),
    );

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <CalendarDays className="size-5 text-primary" /> Calendario de contenido
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tres piezas diarias generadas por IA: Instagram 9:00 a.m., Facebook 1:00 p.m. y TikTok
            6:30 p.m.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => publicarMut.mutate()}
            disabled={publicarMut.isPending}
          >
            {publicarMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Procesar cola
          </Button>
          <Button
            size="sm"
            onClick={() => generarMut.mutate(manana)}
            disabled={generarMut.isPending}
          >
            {generarMut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generar contenido de mañana
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {proximas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No hay contenido programado. Genera el plan del día con un clic.
            </p>
            <Button className="mt-4" size="sm" onClick={() => generarMut.mutate(hoy)}>
              <Sparkles className="size-4" /> Generar contenido de hoy
            </Button>
          </div>
        ) : (
          proximas.slice(0, 8).map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <IconoRed red={p.red} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {fechaLegible(p.fecha_programada)} · {p.hora_programada}
                </span>
                <EstadoBadge estado={p.estado} />
                <Badge variant="outline" className="text-xs">
                  {nombrePilar(p.pilar)}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {p.formato}
                </Badge>
                {p.estado !== "publicado" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => marcarPublicado.mutate(p.id)}
                  >
                    Marcar publicada
                  </Button>
                ) : null}
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{p.titular}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {p.copy}
              </p>
              <p className="mt-3 text-sm font-medium text-primary">{p.cta}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.hashtags.map((h) => (
                  <span key={h} className="text-xs text-accent">
                    {h}
                  </span>
                ))}
              </div>
              {p.idea_visual ? (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Idea visual: </span>
                  {p.idea_visual}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

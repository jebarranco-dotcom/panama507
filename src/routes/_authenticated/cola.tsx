import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EstadoBadge, IconoRed } from "@/components/Estado";
import { Button } from "@/components/ui/button";
import { correrProgramador, publicarAhora } from "@/lib/borradores.functions";
import { useEmpresa } from "@/lib/empresa";
import { publicacionesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/cola")({
  head: () => ({
    meta: [
      { title: "Cola de publicaciones por empresa | Centro de redes" },
      {
        name: "description",
        content:
          "Publicaciones en cola, programadas y publicadas de cada empresa, con reenvío manual cuando el programador no alcanza.",
      },
      { property: "og:title", content: "Cola de publicaciones | Centro de redes" },
      {
        property: "og:description",
        content: "Estado de envío por empresa y reenvío manual de publicaciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaCola,
});

const GRUPOS = [
  { id: "en_cola", titulo: "En cola", estados: ["en_cola", "fallido", "error"] },
  { id: "programado", titulo: "Programadas", estados: ["programado"] },
  { id: "publicado", titulo: "Publicadas", estados: ["publicado"] },
] as const;

function PaginaCola() {
  const qc = useQueryClient();
  const { empresaId, empresa } = useEmpresa();
  const { data: pubs = [], isLoading } = useQuery(publicacionesQuery(empresaId));
  const reenviar = useServerFn(publicarAhora);
  const correr = useServerFn(correrProgramador);
  const [enviando, setEnviando] = useState<string | null>(null);

  const refrescar = () => void qc.invalidateQueries({ queryKey: ["publicaciones", empresaId] });

  const reenvio = useMutation({
    mutationFn: (publicacionId: string) => {
      setEnviando(publicacionId);
      return reenviar({ data: { empresaId, publicacionId } });
    },
    onSuccess: (r) => {
      const res = r as { ok?: boolean; estado?: string; mensaje?: string; error?: string };
      if (res?.ok === false || res?.error) {
        toast.warning("No se pudo publicar", { description: res.error ?? res.mensaje });
      } else {
        toast.success("Reenvío realizado", { description: res?.mensaje ?? res?.estado });
      }
    },
    onError: (e: Error) => toast.error("Fallo el reenvío", { description: e.message }),
    onSettled: () => {
      setEnviando(null);
      refrescar();
    },
  });

  const lote = useMutation({
    mutationFn: () => correr({ data: { empresaId } }),
    onSuccess: () => toast.success("Programador ejecutado para esta empresa"),
    onError: (e: Error) => toast.error(e.message),
    onSettled: refrescar,
  });

  return (
    <AppShell
      titulo="Cola de publicaciones"
      descripcion={`${empresa.nombre}: en cola, programadas y publicadas. Reenvía manualmente si el programador no alcanzó una pieza.`}
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => lote.mutate()} disabled={lote.isPending}>
            {lote.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Procesar cola ahora
          </Button>
        </div>
        {isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {GRUPOS.map((g) => {
              const lista = pubs.filter((p) => (g.estados as readonly string[]).includes(p.estado));
              return (
                <section key={g.id} className="panel p-4">
                  <h2 className="mb-3 flex items-center justify-between font-display font-bold">
                    {g.titulo}
                    <span className="text-sm text-muted-foreground">{lista.length}</span>
                  </h2>
                  {lista.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin publicaciones.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lista.slice(0, 40).map((p) => (
                        <li key={p.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <IconoRed red={p.red} />
                            {p.fecha_programada} · {p.hora_programada}
                            <span className="ml-auto">
                              <EstadoBadge estado={p.estado} />
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold">{p.titular}</p>
                          {p.error_publicacion ? (
                            <p className="mt-1 text-xs text-destructive">{p.error_publicacion}</p>
                          ) : null}
                          {p.referencia_externa ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              ID en la red: {p.referencia_externa}
                            </p>
                          ) : null}
                          {p.estado !== "publicado" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2"
                              disabled={enviando === p.id}
                              onClick={() => reenvio.mutate(p.id)}
                            >
                              {enviando === p.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Send className="size-4" />
                              )}
                              Reenviar ahora
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

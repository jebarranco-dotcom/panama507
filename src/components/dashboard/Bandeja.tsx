import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EstadoBadge, IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sugerirRespuesta } from "@/lib/marketing.functions";
import { useEmpresa } from "@/lib/empresa";
import { colaboradoresQuery, mensajesQuery } from "@/lib/queries";

type CambiosMensaje = {
  estado?: string;
  respuesta?: string;
  respondido_at?: string;
  colaborador_id?: string | null;
  prioridad?: string;
  notas?: string;
  proximo_seguimiento?: string | null;
};

export function Bandeja() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  const { data: mensajes = [] } = useQuery(mensajesQuery(empresaId));
  const { data: equipo = [] } = useQuery(colaboradoresQuery(empresaId));
  const sugerir = useServerFn(sugerirRespuesta);
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("abiertos");

  const refrescar = () => {
    void qc.invalidateQueries({ queryKey: ["mensajes", empresaId] });
  };

  const actualizar = useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: CambiosMensaje;
    }) => {
      const { error } = await supabase.from("mensajes").update(cambios).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refrescar,
    onError: (e: Error) => toast.error(e.message),
  });

  const pedirSugerencia = async (id: string) => {
    setCargando(id);
    try {
      const r = await sugerir({ data: { mensajeId: id } });
      setBorradores((b) => ({ ...b, [id]: r.respuesta }));
      toast.success("Respuesta sugerida", { description: r.siguiente_paso });
    } catch (e) {
      toast.error("No se pudo redactar la respuesta", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCargando(null);
    }
  };

  const visibles = mensajes.filter((m) =>
    filtro === "todos" ? true : filtro === "abiertos" ? m.estado !== "cerrado" : m.estado === filtro,
  );

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Inbox className="size-5 text-primary" /> Solicitudes y mensajería
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bandeja unificada de Facebook, Instagram y TikTok con respuesta asistida y seguimiento.
          </p>
        </div>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abiertos">Abiertos</SelectItem>
            <SelectItem value="nuevo">Nuevos</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="respondido">Respondidos</SelectItem>
            <SelectItem value="cerrado">Cerrados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        {visibles.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Bandeja al día. No hay mensajes en este filtro.
          </p>
        ) : (
          visibles.map((m) => (
            <article key={m.id} className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <IconoRed red={m.red} />
                <span className="text-sm font-semibold">{m.remitente}</span>
                <span className="text-xs text-muted-foreground">{m.usuario_remitente}</span>
                <EstadoBadge estado={m.estado} />
                <Badge variant="outline" className="text-xs capitalize">
                  {m.intencion}
                </Badge>
                {m.prioridad === "alta" ? (
                  <Badge
                    variant="outline"
                    className="border-destructive/40 bg-destructive/10 text-xs text-destructive"
                  >
                    prioridad alta
                  </Badge>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("es-PA", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed">{m.mensaje}</p>

              <Textarea
                className="mt-3 min-h-20"
                placeholder="Escribe la respuesta o genérala con IA…"
                value={borradores[m.id] ?? m.respuesta ?? ""}
                onChange={(e) => setBorradores((b) => ({ ...b, [m.id]: e.target.value }))}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void pedirSugerencia(m.id)}
                  disabled={cargando === m.id}
                >
                  {cargando === m.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Redactar con IA
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    actualizar.mutate({
                      id: m.id,
                      cambios: {
                        respuesta: borradores[m.id] ?? m.respuesta ?? "",
                        estado: "respondido",
                        respondido_at: new Date().toISOString(),
                      },
                    })
                  }
                  disabled={!(borradores[m.id] ?? m.respuesta)}
                >
                  Enviar y marcar respondido
                </Button>
                <Select
                  value={m.colaborador_id ?? "sin_asignar"}
                  onValueChange={(v) =>
                    actualizar.mutate({
                      id: m.id,
                      cambios: {
                        colaborador_id: v === "sin_asignar" ? null : v,
                        estado: m.estado === "nuevo" ? "en_proceso" : m.estado,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Asignar colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                    {equipo.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actualizar.mutate({ id: m.id, cambios: { estado: "cerrado" } })}
                >
                  Cerrar
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

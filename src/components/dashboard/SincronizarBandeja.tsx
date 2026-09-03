import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";

import { useEmpresa } from "@/lib/empresa";
import { sincronizarConversaciones } from "@/lib/mensajeria.functions";
import { Button } from "@/components/ui/button";

type Resultado = {
  estado: "ok" | "error" | "pending_oauth";
  red: string;
  detalle: string;
  requisitos: string[];
  nuevas: number;
  mensajes: number;
};

export function SincronizarBandeja() {
  const { empresaId } = useEmpresa();
  const cliente = useQueryClient();
  const sincronizar = useServerFn(sincronizarConversaciones);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const mutacion = useMutation({
    mutationFn: async () =>
      sincronizar({ data: { empresaId, red: "todas" as const } }),
    onSuccess: (respuesta) => {
      setResultados(respuesta.resultados as Resultado[]);
      void cliente.invalidateQueries();
    },
    onError: (error: Error) => {
      setResultados([
        {
          estado: "error",
          red: "meta",
          detalle: error.message,
          requisitos: [],
          nuevas: 0,
          mensajes: 0,
        },
      ]);
    },
  });

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Conversaciones reales de Meta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Descarga los mensajes de Facebook Messenger e Instagram Direct de esta empresa. Solo
            lectura: nada se responde de forma automática.
          </p>
        </div>
        <Button onClick={() => mutacion.mutate()} disabled={mutacion.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${mutacion.isPending ? "animate-spin" : ""}`} />
          {mutacion.isPending ? "Sincronizando…" : "Sincronizar bandeja"}
        </Button>
      </div>

      {resultados.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {resultados.map((r) => (
            <li
              key={r.red}
              className={`rounded-lg border p-3 ${
                r.estado === "ok"
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : r.estado === "pending_oauth"
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <p className="font-semibold capitalize">
                {r.red} ·{" "}
                {r.estado === "ok"
                  ? `${r.nuevas} conversación(es) nueva(s), ${r.mensajes} mensaje(s)`
                  : r.estado === "pending_oauth"
                    ? "autorización pendiente"
                    : "error"}
              </p>
              <p className="mt-1 text-muted-foreground">{r.detalle}</p>
              {r.requisitos.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Permisos requeridos: {r.requisitos.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

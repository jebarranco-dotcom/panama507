import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Globe2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmpresa } from "@/lib/empresa";
import { guardarZonaHoraria } from "@/lib/programacion.functions";
import { logsQuery } from "@/lib/queries";

const ZONAS = [
  "America/Panama",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
] as const;

const ETIQUETA_ESTADO: Record<string, string> = {
  ok: "Correcta",
  error: "Con error",
  omitido: "Omitida (evitó duplicado)",
};

export function Automatizacion() {
  const qc = useQueryClient();
  const { empresa, empresaId } = useEmpresa();
  const { data: logs = [], isLoading, error } = useQuery(logsQuery(empresaId));
  const [zona, setZona] = useState(empresa.zona_horaria);
  const guardar = useServerFn(guardarZonaHoraria);

  const mutacion = useMutation({
    mutationFn: () => guardar({ data: { empresaId, zonaHoraria: zona } }),
    onSuccess: () => {
      toast.success("Zona horaria actualizada");
      void qc.invalidateQueries({ queryKey: ["empresas"] });
    },
    onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
  });

  const ultima = logs[0];

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Activity className="size-4 text-primary" /> Automatización
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El programador revisa la cola cada 10 minutos y la rutina diaria corre cada mañana.
            Cada ejecución se registra con una clave única para no duplicar publicaciones.
          </p>
        </div>
        <span
          className={
            ultima
              ? "rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success"
              : "rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground"
          }
        >
          {ultima ? "Activa · última ejecución registrada" : "Sin ejecuciones registradas todavía"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-y border-border py-4">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Globe2 className="size-3.5" /> Zona horaria de operación
          </p>
          <Select value={zona} onValueChange={setZona}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONAS.map((z) => (
                <SelectItem key={z} value={z}>
                  {z.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => mutacion.mutate()}
          disabled={mutacion.isPending || zona === empresa.zona_horaria}
        >
          {mutacion.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Guardar zona horaria
        </Button>
      </div>

      <h3 className="mt-4 text-sm font-semibold">Últimas ejecuciones</h3>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{(error as Error).message}</p>
      ) : isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Cargando registros…</p>
      ) : logs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no hay ejecuciones registradas para esta empresa.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium">{l.proceso.replace("_", " ")}</span>
              <span className="text-muted-foreground">{l.detalle}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(l.created_at).toLocaleString("es-PA")} ·{" "}
                {ETIQUETA_ESTADO[l.estado] ?? l.estado} · {l.duracion_ms} ms
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

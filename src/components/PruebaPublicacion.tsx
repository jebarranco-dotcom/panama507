import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FlaskConical, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { REDES } from "@/lib/estrategia";
import { publicarPrueba } from "@/lib/prueba.functions";

type Red = "facebook" | "instagram" | "tiktok";
type Resultado = Awaited<ReturnType<typeof publicarPrueba>>;

const REDES_PRUEBA: Red[] = ["facebook", "instagram", "tiktok"];

/** Botón de prueba por red con el resultado detallado por empresa. */
export function PruebaPublicacion({ soloRed }: { soloRed?: Red }) {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const ejecutar = useServerFn(publicarPrueba);
  const [cargando, setCargando] = useState<Red | null>(null);
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});

  const redes = soloRed ? [soloRed] : REDES_PRUEBA;

  const probar = async (red: Red) => {
    setCargando(red);
    try {
      const resultado = await ejecutar({ data: { empresaId, red } });
      setResultados((r) => ({ ...r, [red]: resultado }));
      void queryClient.invalidateQueries({ queryKey: ["publicaciones", empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] });
      if (resultado.ok) {
        toast.success(`Prueba publicada en ${REDES[red].nombre}`, { description: resultado.detalle });
      } else {
        toast.warning(`Prueba registrada sin envío real en ${REDES[red].nombre}`, {
          description: resultado.detalle,
        });
      }
    } catch (e) {
      toast.error("No se pudo ejecutar la prueba", { description: (e as Error).message });
    } finally {
      setCargando(null);
    }
  };

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <FlaskConical className="size-5 text-primary" /> Publicación de prueba
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {empresa.nombre}: genera un post corto de prueba y lo envía a la red seleccionada. Si la red aún no
        está conectada oficialmente, la prueba queda registrada e indica qué falta.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {redes.map((red) => (
          <Button
            key={red}
            variant="outline"
            disabled={cargando === red}
            onClick={() => void probar(red)}
          >
            {cargando === red ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <IconoRed red={red} className="size-4" />
            )}
            Probar {REDES[red].nombre}
          </Button>
        ))}
      </div>

      {redes.some((r) => resultados[r]) ? (
        <ul className="mt-4 space-y-3">
          {redes
            .map((r) => resultados[r])
            .filter((r): r is Resultado => Boolean(r))
            .map((r) => (
              <li key={r.red} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <IconoRed red={r.red} className="size-4" />
                  <span className="text-sm font-semibold">{REDES[r.red].nombre}</span>
                  <Badge
                    variant="outline"
                    className={
                      r.ok
                        ? "border-success/40 bg-success/15 text-success"
                        : "border-warning/40 bg-warning/15 text-warning"
                    }
                  >
                    {r.ok ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <XCircle className="size-3.5" />
                    )}
                    {r.modo === "real" && r.ok ? "Publicada en la red" : "Registro interno"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {r.empresa} · {new Date(r.ejecutadoAt).toLocaleString("es-PA")} · estado {r.estado}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{r.titular}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{r.copy}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.detalle}</p>
                {r.referenciaExterna ? (
                  <p className="mt-1 text-xs text-success">ID en la red: {r.referenciaExterna}</p>
                ) : null}
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}

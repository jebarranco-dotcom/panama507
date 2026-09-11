import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Facebook, Instagram, Loader2, RefreshCw, ServerCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { activosSistema, conectarSistema } from "@/lib/oauth.functions";

type Activo = {
  paginaId: string;
  paginaNombre: string;
  instagramId: string;
  instagramUsuario: string;
};

export function TokenSistema({ puedeAdministrar }: { puedeAdministrar: boolean }) {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const leer = useServerFn(activosSistema);
  const conectar = useServerFn(conectarSistema);

  const [cargando, setCargando] = useState(false);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [detalle, setDetalle] = useState("");

  const traer = async () => {
    setCargando(true);
    try {
      const r = await leer({ data: { empresaId } });
      setActivos(r.paginas);
      setDetalle(r.detalle);
      if (r.ok) toast.success("Activos leídos con el token de sistema");
      else toast.error("Sin activos disponibles", { description: r.detalle });
    } catch (e) {
      toast.error("No se pudo leer los activos", { description: (e as Error).message });
    } finally {
      setCargando(false);
    }
  };

  const vincular = async (red: "facebook" | "instagram", paginaId: string) => {
    setTrabajando(`${red}-${paginaId}`);
    try {
      const r = await conectar({ data: { empresaId, red, paginaId } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conexiones_redes", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["cuentas_sociales", empresaId] }),
      ]);
      if (r.conectada) toast.success(`Conectado: ${r.cuentaNombre}`);
      else toast.warning("Vinculado con pendientes", { description: r.faltantes.join(", ") });
    } catch (e) {
      toast.error("No se pudo conectar", { description: (e as Error).message });
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ServerCog className="size-5 text-primary" /> Conexión con token de sistema
        </h2>
        <Button variant="outline" disabled={!puedeAdministrar || cargando} onClick={() => void traer()}>
          {cargando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Leer activos
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {empresa.nombre}: usa el token permanente de Meta guardado en el servidor para vincular la
        página y la cuenta de Instagram sin abrir la ventana de consentimiento. El token nunca sale
        del servidor.
      </p>

      {detalle ? (
        <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {detalle}
        </p>
      ) : null}

      {activos?.length ? (
        <ul className="mt-4 space-y-2">
          {activos.map((a) => (
            <li key={a.paginaId} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Facebook className="size-4 text-primary" /> {a.paginaNombre}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">ID {a.paginaId}</p>
                </div>
                <Button
                  size="sm"
                  disabled={!puedeAdministrar || trabajando === `facebook-${a.paginaId}`}
                  onClick={() => void vincular("facebook", a.paginaId)}
                >
                  {trabajando === `facebook-${a.paginaId}` ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Conectar Facebook
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <p className="flex items-center gap-2 text-sm">
                  <Instagram className="size-4 text-primary" />
                  {a.instagramUsuario
                    ? `@${a.instagramUsuario}`
                    : "Sin Instagram profesional vinculado"}
                </p>
                {a.instagramId ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!puedeAdministrar || trabajando === `instagram-${a.paginaId}`}
                    onClick={() => void vincular("instagram", a.paginaId)}
                  >
                    {trabajando === `instagram-${a.paginaId}` ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    Conectar Instagram
                  </Button>
                ) : (
                  <Badge variant="outline" className="border-warning/40 bg-warning/15 text-warning">
                    Pendiente en Meta Business Suite
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!puedeAdministrar ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Solo un administrador o gestor de la empresa puede vincular activos.
        </p>
      ) : null}
    </section>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Facebook, Instagram, Loader2, RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { elegirActivo, sincronizarActivosMeta } from "@/lib/oauth.functions";

type Activo = {
  paginaId: string;
  paginaNombre: string;
  instagramId: string;
  instagramUsuario: string;
};

export function ActivosMeta({
  puedeAdministrar,
  verificada,
  seleccionFacebook,
  seleccionInstagram,
}: {
  puedeAdministrar: boolean;
  verificada: boolean;
  seleccionFacebook: string;
  seleccionInstagram: string;
}) {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const sincronizar = useServerFn(sincronizarActivosMeta);
  const elegir = useServerFn(elegirActivo);

  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [detalle, setDetalle] = useState("");

  const traer = async () => {
    setCargando(true);
    try {
      const r = await sincronizar({ data: { empresaId } });
      setActivos(r.paginas);
      setDetalle(r.detalle);
      if (r.ok) toast.success("Activos de Meta sincronizados");
      else toast.error("Nada que sincronizar todavía", { description: r.detalle });
    } catch (e) {
      toast.error("No se pudo sincronizar", { description: (e as Error).message });
    } finally {
      setCargando(false);
    }
  };

  const usar = async (red: "facebook" | "instagram", cuentaId: string, cuentaNombre: string) => {
    setAsignando(`${red}-${cuentaId}`);
    try {
      const r = await elegir({ data: { empresaId, red, cuentaId, cuentaNombre } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conexiones_redes", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["cuentas_sociales", empresaId] }),
      ]);
      if (r.conectada) toast.success("Cuenta vinculada y conectada");
      else toast.warning("Cuenta vinculada con permisos pendientes", { description: r.detalle });
    } catch (e) {
      toast.error("No se pudo vincular", { description: (e as Error).message });
    } finally {
      setAsignando(null);
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Users className="size-5 text-primary" /> Páginas e Instagram disponibles
        </h2>
        <Button
          variant="outline"
          disabled={!puedeAdministrar || !verificada || cargando}
          onClick={() => void traer()}
        >
          {cargando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Sincronizar activos de Meta
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {empresa.nombre}: lee las páginas de Facebook y las cuentas de Instagram profesionales que la
        autorización vigente puede administrar y elige cuál usa esta empresa.
      </p>

      {!verificada ? (
        <p className="mt-3 text-xs text-warning">
          Primero verifica la app de Meta en Credenciales para habilitar la sincronización.
        </p>
      ) : null}

      {detalle ? (
        <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          {detalle}
        </p>
      ) : null}

      {activos?.length ? (
        <ul className="mt-4 space-y-2">
          {activos.map((a) => {
            const fbActivo = seleccionFacebook === a.paginaId;
            const igActivo = Boolean(a.instagramId) && seleccionInstagram === a.instagramId;
            return (
              <li
                key={a.paginaId}
                className="rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Facebook className="size-4 text-primary" /> {a.paginaNombre}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">ID {a.paginaId}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={fbActivo ? "outline" : "default"}
                    disabled={!puedeAdministrar || fbActivo || asignando === `facebook-${a.paginaId}`}
                    onClick={() => void usar("facebook", a.paginaId, a.paginaNombre)}
                  >
                    {asignando === `facebook-${a.paginaId}` ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : fbActivo ? (
                      <Check className="size-3.5 text-success" />
                    ) : null}
                    {fbActivo ? "En uso para Facebook" : "Usar para Facebook"}
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <Instagram className="size-4 text-primary" />
                      {a.instagramUsuario ? `@${a.instagramUsuario}` : "Sin Instagram profesional vinculado"}
                    </p>
                    {a.instagramId ? (
                      <p className="font-mono text-xs text-muted-foreground">ID {a.instagramId}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Vincula la cuenta profesional a esta página en Meta Business Suite.
                      </p>
                    )}
                  </div>
                  {a.instagramId ? (
                    <Button
                      size="sm"
                      variant={igActivo ? "outline" : "default"}
                      disabled={
                        !puedeAdministrar || igActivo || asignando === `instagram-${a.instagramId}`
                      }
                      onClick={() => void usar("instagram", a.instagramId, a.instagramUsuario)}
                    >
                      {asignando === `instagram-${a.instagramId}` ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : igActivo ? (
                        <Check className="size-3.5 text-success" />
                      ) : null}
                      {igActivo ? "En uso para Instagram" : "Usar para Instagram"}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-warning/40 bg-warning/15 text-warning">
                      Pendiente en Meta Business Suite
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!puedeAdministrar ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Solo un administrador o gestor de la empresa puede sincronizar y elegir activos.
        </p>
      ) : null}
    </section>
  );
}

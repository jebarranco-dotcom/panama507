import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Facebook,
  Instagram,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { autorizarActivo, sincronizarActivosMeta } from "@/lib/oauth.functions";

type Activo = {
  paginaId: string;
  paginaNombre: string;
  instagramId: string;
  instagramUsuario: string;
};

type EstadoActivo = "aprobado" | "pendiente" | "error";

const ETIQUETA: Record<EstadoActivo, { texto: string; clase: string }> = {
  aprobado: {
    texto: "Aprobado para publicar",
    clase: "border-success/40 bg-success/15 text-success",
  },
  pendiente: {
    texto: "Pendiente de permisos",
    clase: "border-warning/40 bg-warning/15 text-warning",
  },
  error: {
    texto: "Error de autorización",
    clase: "border-destructive/40 bg-destructive/15 text-destructive",
  },
};

export function ActivosMeta({
  puedeAdministrar,
  verificada,
  seleccionFacebook,
  seleccionInstagram,
  estadoFacebook,
  estadoInstagram,
}: {
  puedeAdministrar: boolean;
  verificada: boolean;
  seleccionFacebook: string;
  seleccionInstagram: string;
  estadoFacebook?: string;
  estadoInstagram?: string;
}) {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const sincronizar = useServerFn(sincronizarActivosMeta);
  const autorizar = useServerFn(autorizarActivo);

  const [cargando, setCargando] = useState(false);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [detalle, setDetalle] = useState("");
  const [resultados, setResultados] = useState<
    Record<string, { estado: EstadoActivo; detalle: string }>
  >({});

  const estadoGuardado = (red: "facebook" | "instagram", cuentaId: string): EstadoActivo | null => {
    const seleccion = red === "facebook" ? seleccionFacebook : seleccionInstagram;
    if (!cuentaId || seleccion !== cuentaId) return null;
    const estado = red === "facebook" ? estadoFacebook : estadoInstagram;
    if (estado === "conectada") return "aprobado";
    if (estado === "error") return "error";
    if (estado === "autorizada") return "pendiente";
    return null;
  };

  const estadoDe = (red: "facebook" | "instagram", cuentaId: string) =>
    resultados[`${red}-${cuentaId}`]?.estado ?? estadoGuardado(red, cuentaId);

  const traer = async (manual: boolean) => {
    setCargando(true);
    try {
      const r = await sincronizar({ data: { empresaId } });
      setActivos(r.paginas);
      setDetalle(r.detalle);
      await queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] });
      if (r.cambio) {
        toast.info("El listado de activos cambió", { description: r.detalle });
      } else if (r.ok) {
        toast.success(manual ? "Activos actualizados" : "Activos de Meta sincronizados");
      } else {
        toast.error("Nada que sincronizar todavía", { description: r.detalle });
      }
    } catch (e) {
      toast.error("No se pudo sincronizar", { description: (e as Error).message });
    } finally {
      setCargando(false);
    }
  };

  const usar = async (red: "facebook" | "instagram", cuentaId: string, cuentaNombre: string) => {
    setAsignando(`${red}-${cuentaId}`);
    try {
      const r = await autorizar({ data: { empresaId, red, cuentaId, cuentaNombre } });
      setResultados((prev) => ({
        ...prev,
        [`${red}-${cuentaId}`]: { estado: r.estado as EstadoActivo, detalle: r.detalle },
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conexiones_redes", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] }),
        queryClient.invalidateQueries({ queryKey: ["cuentas_sociales", empresaId] }),
      ]);
      if (r.estado === "aprobado") toast.success("Activo aprobado para publicar");
      else if (r.estado === "pendiente")
        toast.warning("Activo vinculado con permisos pendientes", { description: r.detalle });
      else toast.error("No se pudo autorizar el activo", { description: r.detalle });
    } catch (e) {
      toast.error("No se pudo autorizar", { description: (e as Error).message });
    } finally {
      setAsignando(null);
    }
  };

  const botonActivo = (
    red: "facebook" | "instagram",
    cuentaId: string,
    cuentaNombre: string,
    etiqueta: string,
  ) => {
    const clave = `${red}-${cuentaId}`;
    const estado = estadoDe(red, cuentaId);
    const trabajando = asignando === clave;
    const reintento = estado === "pendiente" || estado === "error";
    return (
      <Button
        size="sm"
        variant={estado === "aprobado" ? "outline" : reintento ? "secondary" : "default"}
        disabled={!puedeAdministrar || trabajando}
        onClick={() => void usar(red, cuentaId, cuentaNombre)}
      >
        {trabajando ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : estado === "aprobado" ? (
          <Check className="size-3.5 text-success" />
        ) : reintento ? (
          <RotateCcw className="size-3.5" />
        ) : (
          <KeyRound className="size-3.5" />
        )}
        {estado === "aprobado"
          ? `Revalidar ${etiqueta}`
          : reintento
            ? `Reintentar ${etiqueta}`
            : `Autorizar ${etiqueta}`}
      </Button>
    );
  };

  const insignia = (red: "facebook" | "instagram", cuentaId: string) => {
    const estado = estadoDe(red, cuentaId);
    if (!estado) {
      return (
        <Badge variant="outline" className="border-border text-muted-foreground">
          <CircleDashed className="mr-1 size-3" /> Sin autorizar
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className={ETIQUETA[estado].clase}>
        {estado === "aprobado" ? (
          <Check className="mr-1 size-3" />
        ) : (
          <AlertTriangle className="mr-1 size-3" />
        )}
        {ETIQUETA[estado].texto}
      </Badge>
    );
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
          onClick={() => void traer(true)}
        >
          {cargando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Actualizar activos
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {empresa.nombre}: lee las páginas de Facebook y las cuentas de Instagram profesionales que la
        autorización vigente puede administrar, autoriza cada activo y confirma su estado antes de
        publicar.
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
          {activos.map((a) => (
            <li key={a.paginaId} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Facebook className="size-4 text-primary" /> {a.paginaNombre}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">ID {a.paginaId}</p>
                  <div className="mt-2">{insignia("facebook", a.paginaId)}</div>
                </div>
                {botonActivo("facebook", a.paginaId, a.paginaNombre, "Facebook")}
              </div>
              {resultados[`facebook-${a.paginaId}`] ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {resultados[`facebook-${a.paginaId}`]!.detalle}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm">
                    <Instagram className="size-4 text-primary" />
                    {a.instagramUsuario
                      ? `@${a.instagramUsuario}`
                      : "Sin Instagram profesional vinculado"}
                  </p>
                  {a.instagramId ? (
                    <>
                      <p className="font-mono text-xs text-muted-foreground">ID {a.instagramId}</p>
                      <div className="mt-2">{insignia("instagram", a.instagramId)}</div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Vincula la cuenta profesional a esta página en Meta Business Suite.
                    </p>
                  )}
                </div>
                {a.instagramId ? (
                  botonActivo("instagram", a.instagramId, a.instagramUsuario, "Instagram")
                ) : (
                  <Badge variant="outline" className="border-warning/40 bg-warning/15 text-warning">
                    Pendiente en Meta Business Suite
                  </Badge>
                )}
              </div>
              {resultados[`instagram-${a.instagramId}`] ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {resultados[`instagram-${a.instagramId}`]!.detalle}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!puedeAdministrar ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Solo un administrador o gestor de la empresa puede sincronizar y autorizar activos.
        </p>
      ) : null}
    </section>
  );
}

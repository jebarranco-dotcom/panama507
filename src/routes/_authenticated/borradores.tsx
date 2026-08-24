import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Loader2,
  Pencil,
  PlayCircle,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EstadoBadge, IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  aprobarBorrador,
  cambiarModoAprobacion,
  correrProgramador,
  descartarBorrador,
  devolverABorrador,
  editarBorrador,
  estadoProgramador,
  publicarAhora,
} from "@/lib/borradores.functions";
import { useEmpresa } from "@/lib/empresa";
import { REDES } from "@/lib/estrategia";
import { publicacionesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/borradores")({
  head: () => ({
    meta: [
      { title: "Revisión y aprobación de publicaciones | Centro de redes" },
      {
        name: "description",
        content:
          "Revisa la vista previa de cada publicación diaria, edítala y apruébala antes de que el programador la envíe a Facebook e Instagram a la hora configurada.",
      },
      { property: "og:title", content: "Revisión y aprobación de publicaciones" },
      {
        property: "og:description",
        content:
          "Modo borrador con vista previa por red, aprobación humana y publicación automática a la hora definida por empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Borradores,
});

type Pieza = {
  id: string;
  red: string;
  estado: string;
  titular: string;
  copy: string;
  cta: string;
  hashtags: string[];
  media_url: string | null;
  hora_programada: string;
  fecha_programada: string;
  idea_visual: string;
  error_publicacion: string | null;
  referencia_externa: string | null;
  aprobada_at: string | null;
};

function Borradores() {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: publicaciones = [] } = useQuery(publicacionesQuery(empresaId));
  const { data: config } = useQuery({
    queryKey: ["estado-programador", empresaId],
    queryFn: () => estadoProgramador({ data: { empresaId } }),
  });

  const aprobar = useServerFn(aprobarBorrador);
  const devolver = useServerFn(devolverABorrador);
  const descartar = useServerFn(descartarBorrador);
  const enviarAhora = useServerFn(publicarAhora);
  const guardar = useServerFn(editarBorrador);
  const cambiarModo = useServerFn(cambiarModoAprobacion);
  const correr = useServerFn(correrProgramador);

  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Partial<Pieza>>({});

  const puede = config?.puedeAdministrar ?? false;
  const pendientes = (publicaciones as unknown as Pieza[]).filter(
    (p) => p.estado === "borrador" || p.estado === "programado" || p.estado === "error",
  );

  const refrescar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["publicaciones", empresaId] }),
      queryClient.invalidateQueries({ queryKey: ["estado-programador", empresaId] }),
    ]);

  const accion = async (clave: string, fn: () => Promise<unknown>, mensaje: string) => {
    setTrabajando(clave);
    try {
      await fn();
      await refrescar();
      toast.success(mensaje);
    } catch (e) {
      toast.error("No se pudo completar la acción", { description: (e as Error).message });
    } finally {
      setTrabajando(null);
    }
  };

  const abrirEdicion = (p: Pieza) => {
    setEditando(p.id);
    setBorrador({
      titular: p.titular,
      copy: p.copy,
      cta: p.cta,
      hashtags: p.hashtags ?? [],
      media_url: p.media_url ?? "",
      hora_programada: p.hora_programada,
    });
  };

  const guardarEdicion = async (p: Pieza) => {
    setTrabajando(`editar-${p.id}`);
    try {
      await guardar({
        data: {
          empresaId,
          publicacionId: p.id,
          titular: borrador.titular ?? p.titular,
          copy: borrador.copy ?? p.copy,
          cta: borrador.cta ?? "",
          hashtags: borrador.hashtags ?? [],
          mediaUrl: borrador.media_url ?? "",
          horaProgramada: borrador.hora_programada ?? p.hora_programada,
        },
      });
      await refrescar();
      setEditando(null);
      toast.success("Borrador actualizado");
    } catch (e) {
      toast.error("No se pudo guardar", { description: (e as Error).message });
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <AppShell
      titulo="Revisión y aprobación"
      descripcion={`${empresa.nombre}: revisa la vista previa de cada pieza generada, ajústala y apruébala. El programador la envía a su red a la hora configurada (hora de Panamá${
        config?.ahora ? `, ahora ${config.ahora.hora}` : ""
      }).`}
      acciones={
        <Button
          variant="outline"
          disabled={!puede || trabajando === "programador"}
          onClick={() =>
            void accion(
              "programador",
              async () => {
                const r = await correr({ data: { empresaId } });
                const total = r.empresas.reduce((s, e) => s + e.publicadas, 0);
                toast.info(`Programador ejecutado a las ${r.hora}`, {
                  description: `${total} publicación(es) enviadas.`,
                });
              },
              "Programador ejecutado",
            )
          }
        >
          {trabajando === "programador" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          Ejecutar programador ahora
        </Button>
      }
    >
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <ClipboardCheck className="size-5 text-primary" /> Modo borrador
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Con el modo borrador activo, todo el contenido diario espera tu aprobación antes de
              salir a Facebook e Instagram. Al desactivarlo, la rutina publica automáticamente a la
              hora programada.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="modo-borrador" className="text-xs">
              Requiere aprobación
            </Label>
            <Switch
              id="modo-borrador"
              checked={config?.requiereAprobacion ?? true}
              disabled={!puede}
              onCheckedChange={(v) =>
                void accion(
                  "modo",
                  () => cambiarModo({ data: { empresaId, requiereAprobacion: v } }),
                  v ? "Aprobación obligatoria activada" : "Publicación automática sin revisión",
                )
              }
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(config?.programacion ?? []).map((f) => (
            <div
              key={f.red}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs"
            >
              <IconoRed red={f.red} className="size-4" />
              <span className="font-semibold">{REDES[f.red as keyof typeof REDES]?.nombre ?? f.red}</span>
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" /> {f.hora}
              </span>
              <Badge
                variant="outline"
                className={
                  f.activo
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-border text-muted-foreground"
                }
              >
                {f.activo ? "Activa" : "Pausada"}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {pendientes.length === 0 ? (
        <section className="panel mt-4 p-5">
          <p className="text-sm text-muted-foreground">
            No hay piezas pendientes de revisión para {empresa.nombre}. La rutina diaria genera el
            contenido cada mañana y aparecerá aquí en borrador.
          </p>
        </section>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {pendientes.map((p) => {
            const enEdicion = editando === p.id;
            return (
              <section key={p.id} className="panel flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <IconoRed red={p.red} className="size-5" />
                  <p className="text-sm font-semibold">{REDES[p.red as keyof typeof REDES]?.nombre ?? p.red}</p>
                  <EstadoBadge estado={p.estado} />
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {p.fecha_programada} · {p.hora_programada}
                  </span>
                </div>

                {enEdicion ? (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor={`titular-${p.id}`}>Titular</Label>
                      <Input
                        id={`titular-${p.id}`}
                        value={borrador.titular ?? ""}
                        onChange={(e) => setBorrador((b) => ({ ...b, titular: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`copy-${p.id}`}>Copy</Label>
                      <Textarea
                        id={`copy-${p.id}`}
                        rows={8}
                        value={borrador.copy ?? ""}
                        onChange={(e) => setBorrador((b) => ({ ...b, copy: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`cta-${p.id}`}>Llamado a la acción</Label>
                      <Input
                        id={`cta-${p.id}`}
                        value={borrador.cta ?? ""}
                        onChange={(e) => setBorrador((b) => ({ ...b, cta: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`hashtags-${p.id}`}>Hashtags separados por espacio</Label>
                      <Input
                        id={`hashtags-${p.id}`}
                        value={(borrador.hashtags ?? []).join(" ")}
                        onChange={(e) =>
                          setBorrador((b) => ({
                            ...b,
                            hashtags: e.target.value.split(/\s+/).filter(Boolean).slice(0, 10),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`media-${p.id}`}>URL de imagen (obligatoria en Instagram)</Label>
                        <Input
                          id={`media-${p.id}`}
                          value={borrador.media_url ?? ""}
                          onChange={(e) => setBorrador((b) => ({ ...b, media_url: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`hora-${p.id}`}>Hora de envío</Label>
                        <Input
                          id={`hora-${p.id}`}
                          type="time"
                          value={borrador.hora_programada ?? p.hora_programada}
                          onChange={(e) =>
                            setBorrador((b) => ({ ...b, hora_programada: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={trabajando === `editar-${p.id}`}
                        onClick={() => void guardarEdicion(p)}
                      >
                        {trabajando === `editar-${p.id}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : null}
                        Guardar cambios
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex-1 rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Vista previa
                    </p>
                    {p.media_url ? (
                      <img
                        src={p.media_url}
                        alt={`Visual de la publicación: ${p.titular}`}
                        loading="lazy"
                        className="mt-3 aspect-square w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                        Sin imagen cargada. Idea visual sugerida: {p.idea_visual || "sin definir"}.
                        {p.red === "instagram"
                          ? " Instagram requiere una imagen con URL pública para publicar."
                          : ""}
                      </div>
                    )}
                    <p className="mt-3 text-sm font-semibold">{p.titular}</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{p.copy}</p>
                    {p.cta ? <p className="mt-2 text-sm text-primary">{p.cta}</p> : null}
                    {p.hashtags?.length ? (
                      <p className="mt-2 text-xs text-muted-foreground">{p.hashtags.join(" ")}</p>
                    ) : null}
                  </div>
                )}

                {p.error_publicacion ? (
                  <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    {p.error_publicacion}
                  </p>
                ) : null}
                {p.aprobada_at ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="size-3.5" /> Aprobada el{" "}
                    {new Date(p.aprobada_at).toLocaleString("es-PA")}
                  </p>
                ) : null}

                {!enEdicion ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.aprobada_at ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!puede || trabajando === `devolver-${p.id}`}
                        onClick={() =>
                          void accion(
                            `devolver-${p.id}`,
                            () => devolver({ data: { empresaId, publicacionId: p.id } }),
                            "Pieza devuelta a borrador",
                          )
                        }
                      >
                        <RotateCcw className="size-3.5" /> Volver a borrador
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!puede || trabajando === `aprobar-${p.id}`}
                        onClick={() =>
                          void accion(
                            `aprobar-${p.id}`,
                            () => aprobar({ data: { empresaId, publicacionId: p.id } }),
                            "Pieza aprobada: se enviará a su hora",
                          )
                        }
                      >
                        {trabajando === `aprobar-${p.id}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Aprobar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled={!puede} onClick={() => abrirEdicion(p)}>
                      <Pencil className="size-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!puede || trabajando === `ahora-${p.id}`}
                      onClick={() =>
                        void accion(
                          `ahora-${p.id}`,
                          async () => {
                            const r = await enviarAhora({
                              data: { empresaId, publicacionId: p.id },
                            });
                            if (r.ok) toast.success(r.detalle ?? "Publicado");
                            else toast.warning(r.detalle ?? "No se pudo publicar");
                          },
                          "Envío ejecutado",
                        )
                      }
                    >
                      {trabajando === `ahora-${p.id}` ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      Publicar ahora
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={!puede || trabajando === `descartar-${p.id}`}
                      onClick={() =>
                        void accion(
                          `descartar-${p.id}`,
                          () => descartar({ data: { empresaId, publicacionId: p.id } }),
                          "Pieza descartada",
                        )
                      }
                    >
                      <Trash2 className="size-3.5" /> Descartar
                    </Button>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {!puede ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Solo un administrador o gestor de la empresa puede aprobar y publicar contenido.
        </p>
      ) : null}
    </AppShell>
  );
}

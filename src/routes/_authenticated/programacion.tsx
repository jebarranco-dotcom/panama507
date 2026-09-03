import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Clock, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Automatizacion } from "@/components/dashboard/Automatizacion";
import { IconoRed } from "@/components/Estado";
import { PruebaPublicacion } from "@/components/PruebaPublicacion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEmpresa } from "@/lib/empresa";
import { ETIQUETAS_ESTADO, PILARES, PILARES_SERVICIOS, REDES, type Red } from "@/lib/estrategia";
import { guardarProgramacion, leerProgramacion } from "@/lib/programacion.functions";
import { publicacionesQuery } from "@/lib/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/programacion")({
  head: () => ({
    meta: [
      { title: "Programación diaria por empresa y red | Centro de redes" },
      {
        name: "description",
        content:
          "Define la hora de publicación automática de cada empresa en Facebook, Instagram y TikTok, con el pilar de contenido y el formato de cada red.",
      },
      { property: "og:title", content: "Programación diaria por empresa y red" },
      {
        property: "og:description",
        content:
          "Horario de publicación automática configurable por empresa y por red social, con activación independiente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Programacion,
});

type Fila = { red: Red; hora: string; pilar: string; formato: string; activo: boolean };

function Programacion() {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: publicaciones = [] } = useQuery(publicacionesQuery(empresaId));
  const { data } = useQuery({
    queryKey: ["programacion", empresaId],
    queryFn: () => leerProgramacion({ data: { empresaId } }),
  });
  const guardar = useServerFn(guardarProgramacion);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (data?.filas) setFilas(data.filas as Fila[]);
  }, [data]);

  const puede = data?.puedeAdministrar ?? false;
  const pilares = empresa.slug === "gestiones-comerciales" ? PILARES_SERVICIOS : PILARES;
  const cola = publicaciones
    .filter((publicacion) => publicacion.estado !== "publicado")
    .slice(0, 12);

  const actualizar = (red: Red, cambio: Partial<Fila>) =>
    setFilas((f) => f.map((x) => (x.red === red ? { ...x, ...cambio } : x)));

  const enviar = async () => {
    if (filas.some((f) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.hora))) {
      toast.error("Hora inválida", { description: "Usa el formato HH:MM en 24 horas." });
      return;
    }
    setGuardando(true);
    try {
      await guardar({ data: { empresaId, filas } });
      await queryClient.invalidateQueries({ queryKey: ["programacion", empresaId] });
      toast.success("Programación guardada", {
        description: "La rutina diaria usará estas horas para publicar.",
      });
    } catch (e) {
      toast.error("No se pudo guardar", { description: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AppShell
      titulo="Programación diaria"
      descripcion={`${empresa.nombre}: define a qué hora se publica en cada red. La rutina automática genera el contenido temprano y lo envía cuando llega la hora indicada (hora de Panamá).`}
      acciones={
        <Button disabled={!puede || guardando} onClick={() => void enviar()}>
          {guardando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar programación
        </Button>
      }
    >
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <CalendarClock className="size-5 text-primary" /> Horario por red
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {filas.map((fila) => (
            <div key={fila.red} className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconoRed red={fila.red} className="size-5" />
                  <p className="text-sm font-semibold">{REDES[fila.red].nombre}</p>
                </div>
                <Switch
                  checked={fila.activo}
                  disabled={!puede}
                  onCheckedChange={(v) => actualizar(fila.red, { activo: v })}
                  aria-label={`Activar publicación diaria en ${REDES[fila.red].nombre}`}
                />
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor={`hora-${fila.red}`} className="flex items-center gap-1.5">
                    <Clock className="size-3.5" /> Hora de publicación
                  </Label>
                  <Input
                    id={`hora-${fila.red}`}
                    type="time"
                    value={fila.hora}
                    disabled={!puede || !fila.activo}
                    onChange={(e) => actualizar(fila.red, { hora: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Pilar de contenido</Label>
                  <Select
                    value={fila.pilar}
                    disabled={!puede || !fila.activo}
                    onValueChange={(v) => actualizar(fila.red, { pilar: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un pilar" />
                    </SelectTrigger>
                    <SelectContent>
                      {pilares.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Formato</Label>
                  <Select
                    value={fila.formato}
                    disabled={!puede || !fila.activo}
                    onValueChange={(v) => actualizar(fila.red, { formato: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {REDES[fila.red].formatos.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!puede ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Solo un administrador o gestor de la empresa puede cambiar la programación.
          </p>
        ) : null}
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Cola editorial</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Piezas pendientes de aprobación, programación o publicación. La cola se vuelve a
              evaluar cuando una conexión social queda disponible.
            </p>
          </div>
          <Badge variant="outline">{cola.length} pendientes</Badge>
        </div>
        {cola.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay piezas pendientes en la cola editorial.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {cola.map((publicacion) => (
              <div
                key={publicacion.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <IconoRed red={publicacion.red as Red} />
                    <p className="truncate text-sm font-semibold">{publicacion.titular}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {publicacion.fecha_programada} · {publicacion.hora_programada} ·{" "}
                    {publicacion.formato}
                  </p>
                </div>
                <Badge variant={publicacion.estado === "error" ? "destructive" : "secondary"}>
                  {ETIQUETAS_ESTADO[publicacion.estado] ?? publicacion.estado}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel mt-4 p-5 text-xs leading-relaxed text-muted-foreground">
        <p>
          Cada mañana la rutina automática genera el contenido del día para las redes activas y lo
          deja programado con la hora que definas aquí. Al llegar esa hora, la pieza pasa a estado
          publicado: cuando la red ya está conectada por OAuth se envía a la cuenta oficial, y
          mientras la autorización esté pendiente queda registrada en la cola interna con su
          trazabilidad.
        </p>
      </section>

      <div className="mt-4">
        <PruebaPublicacion />
      </div>

      <div className="mt-4">
        <Automatizacion />
      </div>
    </AppShell>
  );
}

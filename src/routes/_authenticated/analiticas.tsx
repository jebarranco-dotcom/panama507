import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Eye, MousePointerClick, MessageCircle, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { useEmpresa } from "@/lib/empresa";
import type { Red } from "@/lib/estrategia";
import { cuentasQuery, publicacionesQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/analiticas")({
  head: () => ({
    meta: [
      { title: "Analíticas de rendimiento | Centro de redes" },
      {
        name: "description",
        content:
          "Métricas de alcance, interacciones, clics, leads y rendimiento por red para las publicaciones inmobiliarias.",
      },
    ],
  }),
  component: Analiticas,
});

const REDES: Red[] = ["instagram", "facebook", "tiktok"];
const COLORES: Record<Red, string> = {
  instagram: "var(--instagram)",
  facebook: "var(--facebook)",
  tiktok: "var(--tiktok)",
};

type Periodo = 7 | 30 | 90;

function Analiticas() {
  const { empresa, empresaId } = useEmpresa();
  const { data: publicaciones = [], isLoading: cargandoPublicaciones } = useQuery(
    publicacionesQuery(empresaId),
  );
  const { data: cuentas = [] } = useQuery(cuentasQuery(empresaId));
  const [periodo, setPeriodo] = useState<Periodo>(30);

  const desde = useMemo(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - periodo + 1);
    return fecha.toISOString().slice(0, 10);
  }, [periodo]);

  const filtradas = useMemo(
    () => publicaciones.filter((publicacion) => publicacion.fecha_programada >= desde),
    [desde, publicaciones],
  );
  const publicadas = filtradas.filter((publicacion) => publicacion.estado === "publicado");
  const alcance = publicadas.reduce((total, p) => total + p.alcance, 0);
  const interacciones = publicadas.reduce((total, p) => total + p.likes + p.comentarios, 0);
  const clics = publicadas.reduce((total, p) => total + p.clics, 0);
  const leads = publicadas.reduce((total, p) => total + p.leads, 0);
  const tasaInteraccion = alcance ? (interacciones / alcance) * 100 : 0;

  const porRed = REDES.map((red) => {
    const piezas = publicadas.filter((p) => p.red === red);
    const redAlcance = piezas.reduce((total, p) => total + p.alcance, 0);
    const redInteracciones = piezas.reduce((total, p) => total + p.likes + p.comentarios, 0);
    return {
      red,
      nombre: REDES_META[red].nombre,
      publicaciones: piezas.length,
      alcance: redAlcance,
      interacciones: redInteracciones,
      clics: piezas.reduce((total, p) => total + p.clics, 0),
      leads: piezas.reduce((total, p) => total + p.leads, 0),
      tasa: redAlcance ? (redInteracciones / redAlcance) * 100 : 0,
    };
  });

  const tendencia = Object.values(
    publicadas.reduce<
      Record<string, { fecha: string; alcance: number; interacciones: number; leads: number }>
    >((acumulado, p) => {
      const fecha = p.fecha_programada;
      acumulado[fecha] ??= { fecha: fecha.slice(5), alcance: 0, interacciones: 0, leads: 0 };
      acumulado[fecha].alcance += p.alcance;
      acumulado[fecha].interacciones += p.likes + p.comentarios;
      acumulado[fecha].leads += p.leads;
      return acumulado;
    }, {}),
  ).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const seguidores = cuentas.reduce((total, cuenta) => total + cuenta.seguidores, 0);

  return (
    <AppShell
      titulo="Analíticas y rendimiento"
      descripcion={`${empresa.nombre}: resultados de las publicaciones registradas durante el período seleccionado.`}
      acciones={
        <div className="flex items-center gap-2" aria-label="Período de analíticas">
          {[7, 30, 90].map((dias) => (
            <button
              key={dias}
              type="button"
              onClick={() => setPeriodo(dias as Periodo)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                periodo === dias
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {dias} días
            </button>
          ))}
        </div>
      }
    >
      {cargandoPublicaciones ? (
        <section className="panel p-6 text-sm text-muted-foreground">Cargando métricas…</section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icono={Eye} etiqueta="Alcance" valor={alcance} />
            <Kpi icono={MessageCircle} etiqueta="Interacciones" valor={interacciones} />
            <Kpi icono={MousePointerClick} etiqueta="Clics" valor={clics} />
            <Kpi icono={Users} etiqueta="Leads" valor={leads} />
            <Kpi
              icono={BarChart3}
              etiqueta="Tasa de interacción"
              valor={`${tasaInteraccion.toFixed(2)}%`}
            />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">Tendencia de resultados</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Datos de publicaciones con estado publicado.
                  </p>
                </div>
                <Badge variant="outline">{publicadas.length} publicaciones</Badge>
              </div>
              {tendencia.length === 0 ? (
                <EmptyAnalytics />
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendencia}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="alcance"
                        name="Alcance"
                        stroke="var(--chart-1)"
                        strokeWidth={2.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="leads"
                        name="Leads"
                        stroke="var(--chart-3)"
                        strokeWidth={2.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="panel p-5">
              <h2 className="font-display text-lg font-bold">Alcance por red</h2>
              {publicadas.length === 0 ? (
                <EmptyAnalytics />
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porRed}>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis dataKey="nombre" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="alcance" name="Alcance" radius={[8, 8, 0, 0]}>
                        {porRed.map((fila) => (
                          <Cell key={fila.red} fill={COLORES[fila.red]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="panel mt-4 overflow-x-auto p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Comparativo por red</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Seguidores registrados: {seguidores.toLocaleString("es-PA")}. Las métricas de
                  publicaciones provienen de la sincronización de cada red.
                </p>
              </div>
            </div>
            <table className="mt-5 w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3">Red</th>
                  <th>Publicaciones</th>
                  <th>Alcance</th>
                  <th>Interacciones</th>
                  <th>Clics</th>
                  <th>Leads</th>
                  <th>Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {porRed.map((fila) => (
                  <tr key={fila.red}>
                    <td className="py-3 font-semibold">{fila.nombre}</td>
                    <td>{fila.publicaciones}</td>
                    <td>{fila.alcance.toLocaleString("es-PA")}</td>
                    <td>{fila.interacciones.toLocaleString("es-PA")}</td>
                    <td>{fila.clics.toLocaleString("es-PA")}</td>
                    <td>{fila.leads}</td>
                    <td>{fila.tasa.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </AppShell>
  );
}

const REDES_META: Record<Red, { nombre: string }> = {
  instagram: { nombre: "Instagram" },
  facebook: { nombre: "Facebook" },
  tiktok: { nombre: "TikTok" },
};

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Eye;
  etiqueta: string;
  valor: number | string;
}) {
  return (
    <div className="panel p-5">
      <Icono className="size-5 text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl font-bold">
        {typeof valor === "number" ? valor.toLocaleString("es-PA") : valor}
      </p>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <p className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      Sin datos publicados para este período.
    </p>
  );
}

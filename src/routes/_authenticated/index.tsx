import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { Eye, Inbox, Loader2, MousePointerClick, Users, Zap } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Bandeja } from "@/components/dashboard/Bandeja";
import { Conexiones } from "@/components/dashboard/Conexiones";
import { Contenido } from "@/components/dashboard/Contenido";
import { Informe } from "@/components/dashboard/Informe";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { estrategiaDe } from "@/lib/estrategia";
import { correrRutina } from "@/lib/marketing.functions";
import {
  cuentasQuery,
  mensajesQuery,
  propiedadesQuery,
  publicacionesQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard de redes sociales | Centro inmobiliario de redes" },
      {
        name: "description",
        content:
          "Centro de mando multiempresa (RENTELO FACIL, PANAMA REAL ESTATE y GESTIONES COMERCIALES): contenido diario automatizado para Facebook, Instagram y TikTok, bandeja de solicitudes e informe de trabajo.",
      },
      { property: "og:title", content: "Dashboard de redes sociales | Centro inmobiliario de redes" },
      {
        property: "og:description",
        content:
          "Automatiza la publicación diaria, atiende solicitudes y mide la captación de clientes inmobiliarios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { empresa, empresaId } = useEmpresa();
  const { data: publicaciones = [] } = useQuery(publicacionesQuery(empresaId));
  const { data: mensajes = [] } = useQuery(mensajesQuery(empresaId));
  const { data: cuentas = [] } = useQuery(cuentasQuery(empresaId));
  const { data: propiedades = [] } = useQuery(propiedadesQuery(empresaId));
  const tipoCatalogo = estrategiaDe(empresa.slug).catalogo;
  const rutina = useServerFn(correrRutina);

  const correr = useMutation({
    mutationFn: () => rutina({ data: { empresaId } }),
    onSuccess: () => {
      toast.success("Rutina diaria ejecutada", {
        description: "Contenido generado, cola procesada e informe actualizado.",
      });
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error("La rutina falló", { description: e.message }),
  });

  const publicadas = publicaciones.filter((p) => p.estado === "publicado");
  const alcance = publicadas.reduce((s, p) => s + p.alcance, 0);
  const clics = publicadas.reduce((s, p) => s + p.clics, 0);
  const leads = publicadas.reduce((s, p) => s + p.leads, 0);
  const seguidores = cuentas.reduce((s, c) => s + c.seguidores, 0);
  const sinAtender = mensajes.filter((m) => m.estado === "nuevo" || m.estado === "en_proceso").length;

  const porFecha = Object.values(
    publicadas.reduce<Record<string, { fecha: string; alcance: number; leads: number }>>(
      (acc, p) => {
        const key = p.fecha_programada;
        acc[key] ??= { fecha: key.slice(5), alcance: 0, leads: 0 };
        acc[key]!.alcance += p.alcance;
        acc[key]!.leads += p.leads;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const porRed = (["instagram", "facebook", "tiktok"] as const).map((red) => ({
    red,
    alcance: publicadas.filter((p) => p.red === red).reduce((s, p) => s + p.alcance, 0),
    leads: publicadas.filter((p) => p.red === red).reduce((s, p) => s + p.leads, 0),
  }));

  const coloresRed: Record<string, string> = {
    instagram: "var(--instagram)",
    facebook: "var(--facebook)",
    tiktok: "var(--tiktok)",
  };

  return (
    <AppShell
      titulo="Dashboard"
      descripcion={`${empresa.nombre}: automatización de contenido, captación y atención de clientes en Facebook, Instagram y TikTok.`}
      acciones={
        <Button onClick={() => correr.mutate()} disabled={correr.isPending}>
          {correr.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          Ejecutar rutina diaria
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi icono={Eye} etiqueta="Alcance acumulado" valor={alcance.toLocaleString("es-PA")} />
        <Kpi icono={Users} etiqueta="Seguidores totales" valor={seguidores.toLocaleString("es-PA")} />
        <Kpi icono={MousePointerClick} etiqueta="Clics al perfil / web" valor={clics.toLocaleString("es-PA")} />
        <Kpi icono={Zap} etiqueta="Leads generados" valor={String(leads)} />
        <Kpi
          icono={Inbox}
          etiqueta="Mensajes por atender"
          valor={String(sinAtender)}
          destacado={sinAtender > 0}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Alcance y leads por día</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={porFecha}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="fecha" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="alcance"
                  name="Alcance"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-lg font-bold">Alcance por red</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porRed}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="red" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="alcance" name="Alcance" radius={[8, 8, 0, 0]}>
                  {porRed.map((r) => (
                    <Cell key={r.red} fill={coloresRed[r.red]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {propiedades.length} {tipoCatalogo} activos en el catálogo que alimenta el contenido.
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4">
        <Contenido />
        <Bandeja />
        <Informe />
        <Conexiones />
      </div>
    </AppShell>
  );
}

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  destacado,
}: {
  icono: typeof Eye;
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{etiqueta}</p>
        <Icono className={destacado ? "size-4 text-warning" : "size-4 text-primary"} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{valor}</p>
    </div>
  );
}

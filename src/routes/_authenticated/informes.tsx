import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Informe } from "@/components/dashboard/Informe";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { informesQuery, publicacionesRedesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/informes")({
  head: () => ({
    meta: [
      { title: "Informes diarios de trabajo | Centro de redes" },
      {
        name: "description",
        content:
          "Historial de informes diarios con publicaciones realizadas, mensajes atendidos, leads captados y métricas por red social, exportable a CSV o PDF.",
      },
      { property: "og:title", content: "Informes diarios de trabajo | Centro de redes" },
      {
        property: "og:description",
        content: "Resumen diario de publicaciones, atención de mensajes, leads y métricas por red.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaInformes,
});

const COLUMNAS = [
  "fecha",
  "publicaciones_publicadas",
  "publicaciones_programadas",
  "mensajes_recibidos",
  "mensajes_atendidos",
  "leads_nuevos",
  "alcance_total",
  "mejor_red",
] as const;

function aCsv(filas: Record<string, unknown>[]) {
  const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    COLUMNAS.join(","),
    ...filas.map((f) => COLUMNAS.map((c) => escapar(f[c])).join(",")),
  ].join("\n");
}

function PaginaInformes() {
  const { empresa, empresaId } = useEmpresa();
  const { data: informes = [], isLoading, error } = useQuery(informesQuery(empresaId));
  const { data: porRed = [] } = useQuery(publicacionesRedesQuery(empresaId));
  const conError = porRed.filter((r) => r.estado === "error");
  const reintentos = porRed.reduce((s, r) => s + r.intentos, 0);

  const descargarCsv = () => {
    const blob = new Blob([aCsv(informes)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informes-${empresa.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      titulo="Informes"
      descripcion="Informe diario generado automáticamente cada noche, con historial y exportación."
      acciones={
        <>
          <Button variant="outline" size="sm" onClick={descargarCsv} disabled={informes.length === 0}>
            <Download className="size-4" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Exportar PDF
          </Button>
        </>
      }
    >
      {error ? (
        <p className="panel p-5 text-sm text-destructive">
          No se pudieron cargar los informes: {(error as Error).message}
        </p>
      ) : null}

      <Informe />

      <section className="panel mt-4 p-5">
        <h2 className="font-display text-lg font-bold">Historial de informes</h2>
        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando historial…</p>
        ) : informes.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Todavía no hay informes registrados para {empresa.nombre}.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Publicadas</th>
                  <th className="py-2 pr-3">Programadas</th>
                  <th className="py-2 pr-3">Mensajes</th>
                  <th className="py-2 pr-3">Leads</th>
                  <th className="py-2 pr-3">Alcance</th>
                  <th className="py-2">Mejor red</th>
                </tr>
              </thead>
              <tbody>
                {informes.map((i) => (
                  <tr key={i.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{i.fecha}</td>
                    <td className="py-2 pr-3">{i.publicaciones_publicadas}</td>
                    <td className="py-2 pr-3">{i.publicaciones_programadas}</td>
                    <td className="py-2 pr-3">
                      {i.mensajes_atendidos}/{i.mensajes_recibidos}
                    </td>
                    <td className="py-2 pr-3">{i.leads_nuevos}</td>
                    <td className="py-2 pr-3">{i.alcance_total.toLocaleString("es-PA")}</td>
                    <td className="py-2 capitalize">{i.mejor_red}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    <section className="panel mt-4 p-5">
        <h2 className="font-display text-lg font-bold">Errores y reintentos de publicación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {porRed.length === 0
            ? "Todavía no hay resultados por red registrados."
            : `${porRed.length} envíos por red · ${conError.length} con error · ${reintentos} intentos acumulados.`}
        </p>
        {conError.length > 0 ? (
          <ul className="mt-3 divide-y divide-border text-sm">
            {conError.slice(0, 10).map((r) => (
              <li key={r.id} className="py-2">
                <p className="font-medium capitalize">
                  {r.red} · {r.intentos} intento(s)
                </p>
                <p className="text-xs text-muted-foreground">{r.error_detalle}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </AppShell>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { IconoRed } from "@/components/Estado";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { publicadasReales } from "@/lib/publicadas.functions";

export const Route = createFileRoute("/_authenticated/publicadas")({
  head: () => ({
    meta: [
      { title: "Publicaciones reales por red | Centro de redes" },
      {
        name: "description",
        content: "Posts reales publicados en Facebook e Instagram con fecha, hora y enlace directo.",
      },
      { property: "og:title", content: "Publicaciones reales por red | Centro de redes" },
      {
        property: "og:description",
        content: "Historial de publicaciones reales en Facebook e Instagram por empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaginaPublicadas,
});

function PaginaPublicadas() {
  const { empresaId, empresa } = useEmpresa();
  const listar = useServerFn(publicadasReales);
  const [red, setRed] = useState<"facebook" | "instagram">("facebook");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["publicadas_reales", empresaId],
    queryFn: () => listar({ data: { empresaId } }),
  });
  const lista = data.filter((p) => p.red === red);

  return (
    <AppShell
      titulo="Publicadas"
      descripcion={`${empresa.nombre}: posts confirmados por cada red, con fecha, hora y enlace.`}
    >
      <div className="mb-4 flex gap-2">
        {(["facebook", "instagram"] as const).map((r) => (
          <Button
            key={r}
            size="sm"
            variant={red === r ? "default" : "outline"}
            onClick={() => setRed(r)}
          >
            <IconoRed red={r} className={red === r ? "text-primary-foreground" : ""} />
            {r === "facebook" ? "Facebook" : "Instagram"}
          </Button>
        ))}
      </div>
      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : lista.length === 0 ? (
        <p className="panel p-6 text-sm text-muted-foreground">Aún no hay posts reales en esta red.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((p) => (
            <li key={p.id} className="panel overflow-hidden">
              {p.mediaUrl ? (
                <img src={p.mediaUrl} alt={p.titular} className="aspect-video w-full object-cover" loading="lazy" />
              ) : null}
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  {p.publicadoAt
                    ? new Date(p.publicadoAt).toLocaleString("es-PA", {
                        timeZone: empresa.zona_horaria || "America/Panama",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Sin fecha"}
                </p>
                <p className="mt-1 text-sm font-semibold">{p.titular}</p>
                {p.enlace ? (
                  <a
                    href={p.enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Ver en {p.red === "facebook" ? "Facebook" : "Instagram"}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Ref. {p.referencia}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

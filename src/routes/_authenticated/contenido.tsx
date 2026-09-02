import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Contenido } from "@/components/dashboard/Contenido";
import { useEmpresa } from "@/lib/empresa";

export const Route = createFileRoute("/_authenticated/contenido")({
  head: () => ({
    meta: [
      { title: "Contenido diario inmobiliario | Centro de redes" },
      {
        name: "description",
        content:
          "Genera y revisa el contenido diario para Facebook, Instagram y TikTok con texto, hashtags, llamada a la acción y datos de propiedad.",
      },
      { property: "og:title", content: "Contenido diario inmobiliario | Centro de redes" },
      {
        property: "og:description",
        content:
          "Variantes por red social, estados de aprobación y trazabilidad de cada pieza generada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaContenido,
});

function PaginaContenido() {
  const { empresa } = useEmpresa();
  return (
    <AppShell
      titulo="Contenido"
      descripcion={`Piezas diarias de ${empresa.nombre} con variantes para Facebook, Instagram y TikTok. Nada se publica sin pasar por Borradores si la aprobación está activa.`}
    >
      <Contenido />
    </AppShell>
  );
}

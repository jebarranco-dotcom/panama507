import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Bandeja } from "@/components/dashboard/Bandeja";
import { Seguimiento } from "@/components/dashboard/Seguimiento";
import { SincronizarBandeja } from "@/components/dashboard/SincronizarBandeja";
import { useEmpresa } from "@/lib/empresa";
import { mensajesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/mensajeria")({
  head: () => ({
    meta: [
      { title: "Bandeja unificada de mensajería | Centro de redes" },
      {
        name: "description",
        content:
          "Atiende mensajes y comentarios de Facebook, Instagram y TikTok en una sola bandeja con asignación a colaboradores, estados y seguimiento.",
      },
      { property: "og:title", content: "Bandeja unificada de mensajería | Centro de redes" },
      {
        property: "og:description",
        content:
          "Estados de lead, asignación por colaborador, historial de respuestas y recordatorios de seguimiento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaginaMensajeria,
});

function PaginaMensajeria() {
  const { empresaId } = useEmpresa();
  const { data: mensajes = [], isLoading, error } = useQuery(mensajesQuery(empresaId));

  const cuenta = (f: (m: (typeof mensajes)[number]) => boolean) => mensajes.filter(f).length;

  return (
    <AppShell
      titulo="Mensajería"
      descripcion="Bandeja unificada de mensajes y comentarios. Las respuestas siempre se revisan antes de enviarse: no se envía nada automáticamente."
    >
      {error ? (
        <p className="panel p-5 text-sm text-destructive">
          No se pudieron cargar los mensajes: {(error as Error).message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Tarjeta etiqueta="Nuevos" valor={cuenta((m) => m.estado === "nuevo")} />
        <Tarjeta etiqueta="En atención" valor={cuenta((m) => m.estado === "en_proceso")} />
        <Tarjeta etiqueta="Esperando respuesta" valor={cuenta((m) => m.estado === "respondido")} />
        <Tarjeta
          etiqueta="Con seguimiento agendado"
          valor={cuenta((m) => Boolean(m.proximo_seguimiento))}
        />
        <Tarjeta etiqueta="Cerrados" valor={cuenta((m) => m.estado === "cerrado")} />
      </div>

      <div className="mt-4">
        <SincronizarBandeja />
      </div>

      <div className="mt-4">
        <Seguimiento />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="panel p-8 text-center text-sm text-muted-foreground">Cargando bandeja…</p>
        ) : (
          <Bandeja />
        )}
      </div>
    </AppShell>
  );
}

function Tarjeta({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="mt-2 font-display text-2xl font-bold">{valor}</p>
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  History,
  KeyRound,
  Link2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { IconoRed } from "@/components/Estado";
import { PruebaPublicacion } from "@/components/PruebaPublicacion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { REDES } from "@/lib/estrategia";
import { estadoCredenciales, iniciarOAuth, type RedOAuth } from "@/lib/oauth.functions";
import { conexionEventosQuery, conexionesQuery, cuentasQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/conexiones")({
  head: () => ({
    meta: [
      { title: "Conexión OAuth de redes por empresa | Centro de redes" },
      {
        name: "description",
        content:
          "Autoriza Facebook, Instagram y TikTok por empresa con flujos OAuth separados y marca cada red como conectada solo cuando los permisos quedan aprobados.",
      },
      { property: "og:title", content: "Conexión OAuth de redes por empresa" },
      {
        property: "og:description",
        content:
          "Flujo OAuth independiente por red, resultado guardado por empresa y bitácora de estados hasta la aprobación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Conexiones,
});

const PROVEEDOR: Record<RedOAuth, "meta" | "tiktok"> = {
  facebook: "meta",
  instagram: "meta",
  tiktok: "tiktok",
};

const REQUISITOS: Record<RedOAuth, string[]> = {
  facebook: [
    "Página de Facebook administrada por la cuenta que autoriza",
    "App de Meta Business con Facebook Login for Business",
    "Permisos pages_show_list, pages_read_engagement y pages_manage_posts",
  ],
  instagram: [
    "Cuenta convertida a perfil profesional (Business o Creator)",
    "Instagram vinculado a la página de Facebook de la empresa",
    "Permisos instagram_basic e instagram_content_publish",
  ],
  tiktok: [
    "Cuenta convertida a TikTok Business",
    "App en TikTok for Developers con Login Kit habilitado",
    "Content Posting API aprobada (video.upload y video.publish)",
  ],
};

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  conectada: {
    texto: "Conectada (oficial)",
    clase: "border-success/40 bg-success/15 text-success",
  },
  autorizada: {
    texto: "Autorizada, permisos pendientes",
    clase: "border-warning/40 bg-warning/15 text-warning",
  },
  pendiente: {
    texto: "Pendiente de conexión oficial",
    clase: "border-warning/40 bg-warning/15 text-warning",
  },
  error: { texto: "Error de autorización", clase: "border-destructive/40 bg-destructive/15 text-destructive" },
};

function Conexiones() {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: cuentas = [] } = useQuery(cuentasQuery(empresaId));
  const { data: conexiones = [] } = useQuery(conexionesQuery(empresaId));
  const { data: eventos = [] } = useQuery(conexionEventosQuery(empresaId));
  const { data: credenciales } = useQuery({
    queryKey: ["credenciales-oauth", empresaId],
    queryFn: () => estadoCredenciales({ data: { empresaId } }),
  });
  const iniciar = useServerFn(iniciarOAuth);
  const [cargando, setCargando] = useState<RedOAuth | null>(null);

  const redes: RedOAuth[] = ["facebook", "instagram", "tiktok"];
  const cuentaDe = (red: RedOAuth) => cuentas.find((c) => c.red === red);
  const conexionDe = (red: RedOAuth) => conexiones.find((c) => c.red === red);

  useEffect(() => {
    const alMensaje = (evento: MessageEvent) => {
      if (evento.origin !== window.location.origin) return;
      if ((evento.data as { type?: string })?.type !== "oauth-red") return;
      void queryClient.invalidateQueries({ queryKey: ["conexiones_redes", empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["conexiones_eventos", empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["cuentas_sociales", empresaId] });
    };
    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, [empresaId, queryClient]);

  const conectar = async (red: RedOAuth) => {
    setCargando(red);
    const ventana = window.open("", "oauth-red", "width=620,height=760");
    try {
      const { authorizationUrl } = await iniciar({ data: { empresaId, red } });
      if (!ventana) throw new Error("El navegador bloqueó la ventana emergente.");
      ventana.location.href = authorizationUrl;
    } catch (e) {
      ventana?.close();
      toast.error("No se pudo iniciar la autorización", { description: (e as Error).message });
    } finally {
      setCargando(null);
    }
  };

  return (
    <AppShell
      titulo="Conexión de redes"
      descripcion={`${empresa.nombre}: autoriza cada red por separado. Solo se marca como conectada cuando la red devuelve los permisos y la cuenta requeridos.`}
      acciones={
        <Button asChild variant="outline">
          <Link to="/credenciales">
            <ShieldCheck className="size-4" /> Credenciales de apps
          </Link>
        </Button>
      }
    >
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Link2 className="size-5 text-primary" /> Resumen de estados por red
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {redes.map((red) => {
            const conexion = conexionDe(red);
            const etiqueta = ETIQUETA_ESTADO[conexion?.estado ?? "pendiente"]!;
            return (
              <div key={red} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2">
                  <IconoRed red={red} className="size-5" />
                  <p className="text-sm font-semibold">{REDES[red].nombre}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {conexion?.cuenta_externa_nombre ||
                    cuentaDe(red)?.usuario ||
                    "Sin identificador registrado"}
                </p>
                <Badge variant="outline" className={`mt-3 ${etiqueta.clase}`}>
                  {etiqueta.texto}
                </Badge>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {redes.map((red) => {
          const conexion = conexionDe(red);
          const proveedor = PROVEEDOR[red];
          const listo = credenciales?.[proveedor]?.registrada ?? false;
          const puede = credenciales?.puedeAdministrar ?? false;
          const otorgados = conexion?.permisos_otorgados ?? [];
          const faltantes = conexion?.permisos_faltantes ?? [];
          return (
            <section key={red} className="panel flex flex-col p-5">
              <div className="flex items-center gap-2">
                <IconoRed red={red} className="size-5" />
                <h3 className="font-display text-base font-bold">{REDES[red].nombre}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {conexion?.cuenta_externa_nombre || cuentaDe(red)?.usuario || "Sin identificador registrado"}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {REQUISITOS[red].map((r) => (
                  <li key={r} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    {conexion?.estado === "conectada" ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    )}
                    {r}
                  </li>
                ))}
              </ul>

              {otorgados.length ? (
                <p className="mt-3 text-xs text-success">Aprobados: {otorgados.join(", ")}</p>
              ) : null}
              {faltantes.length ? (
                <p className="mt-1 text-xs text-warning">Faltantes: {faltantes.join(", ")}</p>
              ) : null}
              {conexion?.detalle ? (
                <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                  {conexion.detalle}
                </p>
              ) : null}

              <Button
                className="mt-4 w-full"
                disabled={!listo || !puede || cargando === red}
                onClick={() => void conectar(red)}
              >
                {cargando === red ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {red === "tiktok"
                  ? "Autorizar TikTok"
                  : red === "facebook"
                    ? "Autorizar Facebook"
                    : "Autorizar Instagram"}
              </Button>
              {!listo ? (
                <p className="mt-2 flex gap-1.5 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Credenciales de app pendientes: registra la app de{" "}
                  {proveedor === "meta" ? "Meta Business" : "TikTok for Developers"} en Credenciales.
                </p>
              ) : !puede ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Solo un administrador o gestor de la empresa puede autorizar redes.
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <History className="size-5 text-primary" /> Bitácora de estados
        </h2>
        {eventos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no hay movimientos de autorización para {empresa.nombre}.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {eventos.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("es-PA")}
                </span>
                <Badge variant="outline">{REDES[e.red as RedOAuth]?.nombre ?? e.red}</Badge>
                <Badge variant="outline" className={ETIQUETA_ESTADO[e.estado]?.clase}>
                  {ETIQUETA_ESTADO[e.estado]?.texto ?? e.estado}
                </Badge>
                <span className="text-muted-foreground">{e.mensaje}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

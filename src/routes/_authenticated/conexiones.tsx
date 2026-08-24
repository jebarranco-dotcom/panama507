import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleDashed, KeyRound, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEmpresa } from "@/lib/empresa";
import { REDES } from "@/lib/estrategia";
import { estadoCredenciales, iniciarOAuth, type ProveedorOAuth } from "@/lib/oauth.functions";
import { cuentasQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/conexiones")({
  head: () => ({
    meta: [
      { title: "Conexión de redes por empresa | Centro inmobiliario de redes" },
      {
        name: "description",
        content:
          "Autoriza Facebook, Instagram y TikTok por empresa con botones OAuth independientes y revisa el estado de cada red antes de habilitar la publicación automática.",
      },
      { property: "og:title", content: "Conexión de redes por empresa" },
      {
        property: "og:description",
        content:
          "Autorización OAuth separada para Facebook, Instagram y TikTok, con resumen de estados por red.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Conexiones,
});

type Red = "facebook" | "instagram" | "tiktok";

const PROVEEDOR: Record<Red, ProveedorOAuth> = {
  facebook: "meta",
  instagram: "meta",
  tiktok: "tiktok",
};

const REQUISITOS: Record<Red, string[]> = {
  facebook: [
    "Página de Facebook creada y administrada por la cuenta que autoriza",
    "App de Meta Business con Facebook Login for Business",
    "Permisos pages_show_list, pages_read_engagement y pages_manage_posts",
  ],
  instagram: [
    "Cuenta convertida a perfil profesional (Business o Creator)",
    "Instagram vinculado a la página de Facebook de la empresa",
    "Permisos instagram_basic e instagram_content_publish",
  ],
  tiktok: [
    "Cuenta convertida a TikTok Business (cambio manual en la app de TikTok)",
    "App en TikTok for Developers con Login Kit habilitado",
    "Content Posting API solicitada y aprobada (scopes video.upload y video.publish)",
  ],
};

function Conexiones() {
  const { empresa, empresaId } = useEmpresa();
  const { data: cuentas = [] } = useQuery(cuentasQuery(empresaId));
  const { data: credenciales } = useQuery({
    queryKey: ["credenciales-oauth"],
    queryFn: () => estadoCredenciales(),
  });
  const iniciar = useServerFn(iniciarOAuth);
  const [cargando, setCargando] = useState<Red | null>(null);

  const redes: Red[] = ["facebook", "instagram", "tiktok"];
  const cuentaDe = (red: Red) => cuentas.find((c) => c.red === red);

  const conectar = async (red: Red) => {
    setCargando(red);
    const ventana = window.open("", "oauth-red", "width=620,height=760");
    try {
      const { authorizationUrl } = await iniciar({ data: { proveedor: PROVEEDOR[red] } });
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
      descripcion={`${empresa.nombre}: autoriza cada red por separado. La publicación automática se activa solo cuando la red devuelve los permisos requeridos.`}
    >
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Link2 className="size-5 text-primary" /> Resumen de estados por red
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {redes.map((red) => {
            const cuenta = cuentaDe(red);
            return (
              <div key={red} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center gap-2">
                  <IconoRed red={red} className="size-5" />
                  <p className="text-sm font-semibold">{REDES[red].nombre}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cuenta?.usuario || "Sin identificador registrado"}
                </p>
                <Badge
                  variant="outline"
                  className={
                    cuenta?.conectada
                      ? "mt-3 border-success/40 bg-success/15 text-success"
                      : "mt-3 border-warning/40 bg-warning/15 text-warning"
                  }
                >
                  {cuenta?.conectada ? "Conectada (oficial)" : "Pendiente de conexión oficial"}
                </Badge>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {redes.map((red) => {
          const cuenta = cuentaDe(red);
          const proveedor = PROVEEDOR[red];
          const listo = credenciales?.[proveedor] ?? false;
          return (
            <section key={red} className="panel flex flex-col p-5">
              <div className="flex items-center gap-2">
                <IconoRed red={red} className="size-5" />
                <h3 className="font-display text-base font-bold">{REDES[red].nombre}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {cuenta?.usuario || "Sin identificador registrado"}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {REQUISITOS[red].map((r) => (
                  <li key={r} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    {cuenta?.conectada ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    )}
                    {r}
                  </li>
                ))}
              </ul>

              {cuenta?.notas?.trim() ? (
                <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                  {cuenta.notas}
                </p>
              ) : null}

              <Button
                className="mt-4 w-full"
                disabled={!listo || cargando === red}
                onClick={() => void conectar(red)}
              >
                {cargando === red ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {red === "tiktok" ? "Autorizar con TikTok" : "Autorizar con Meta"}
              </Button>
              {!listo ? (
                <p className="mt-2 text-xs text-warning">
                  Credenciales de app pendientes: falta registrar la app de{" "}
                  {proveedor === "meta" ? "Meta Business" : "TikTok for Developers"} para habilitar
                  este botón.
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

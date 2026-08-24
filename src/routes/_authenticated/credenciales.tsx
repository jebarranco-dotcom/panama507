import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EyeOff, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmpresa } from "@/lib/empresa";
import { estadoCredenciales, guardarCredenciales } from "@/lib/oauth.functions";

export const Route = createFileRoute("/_authenticated/credenciales")({
  head: () => ({
    meta: [
      { title: "Credenciales de apps Meta y TikTok | Centro de redes" },
      {
        name: "description",
        content:
          "Registra y rota por empresa el ID y el secreto de la app de Meta Business y las credenciales de TikTok, con validación y sin mostrar nunca los secretos guardados.",
      },
      { property: "og:title", content: "Credenciales de apps Meta y TikTok" },
      {
        property: "og:description",
        content:
          "Alta y rotación segura de credenciales OAuth por empresa: los secretos se guardan cifrados y jamás se muestran en pantalla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Credenciales,
});

type Proveedor = "meta" | "tiktok";

const CONFIG: Record<
  Proveedor,
  { titulo: string; etiquetaId: string; etiquetaSecreto: string; ayuda: string }
> = {
  meta: {
    titulo: "Meta Business (Facebook e Instagram)",
    etiquetaId: "META_APP_ID",
    etiquetaSecreto: "META_APP_SECRET",
    ayuda:
      "Desde developers.facebook.com → tu app → Configuración básica. La app necesita Facebook Login for Business y los permisos de publicación.",
  },
  tiktok: {
    titulo: "TikTok for Developers",
    etiquetaId: "TIKTOK_CLIENT_KEY",
    etiquetaSecreto: "TIKTOK_CLIENT_SECRET",
    ayuda:
      "Desde developers.tiktok.com → tu app → Credenciales. Requiere Login Kit y solicitud de Content Posting API.",
  },
};

function Credenciales() {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const { data: estado } = useQuery({
    queryKey: ["credenciales-oauth", empresaId],
    queryFn: () => estadoCredenciales({ data: { empresaId } }),
  });
  const guardar = useServerFn(guardarCredenciales);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<Proveedor | null>(null);

  const puede = estado?.puedeAdministrar ?? false;

  const enviar = async (proveedor: Proveedor) => {
    const clientId = (valores[`${proveedor}-id`] ?? "").trim();
    const clientSecret = (valores[`${proveedor}-secret`] ?? "").trim();
    if (clientId.length < 6 || clientSecret.length < 16) {
      toast.error("Datos incompletos", {
        description:
          "Revisa el identificador (mínimo 6 caracteres) y el secreto (mínimo 16 caracteres).",
      });
      return;
    }
    setGuardando(proveedor);
    try {
      await guardar({ data: { empresaId, proveedor, clientId, clientSecret } });
      setValores((v) => ({ ...v, [`${proveedor}-secret`]: "" }));
      await queryClient.invalidateQueries({ queryKey: ["credenciales-oauth", empresaId] });
      toast.success("Credenciales guardadas", {
        description: "El secreto quedó cifrado en el servidor y no se muestra en la interfaz.",
      });
    } catch (e) {
      toast.error("No se pudo guardar", { description: (e as Error).message });
    } finally {
      setGuardando(null);
    }
  };

  return (
    <AppShell
      titulo="Credenciales de apps"
      descripcion={`${empresa.nombre}: registra o rota las credenciales OAuth de Meta y TikTok. Los secretos se guardan cifrados y nunca se devuelven al navegador.`}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {(["meta", "tiktok"] as Proveedor[]).map((proveedor) => {
          const cfg = CONFIG[proveedor];
          const info = estado?.[proveedor];
          return (
            <section key={proveedor} className="panel p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-display text-base font-bold">
                  <ShieldCheck className="size-5 text-primary" /> {cfg.titulo}
                </h2>
                <Badge
                  variant="outline"
                  className={
                    info?.registrada
                      ? "border-success/40 bg-success/15 text-success"
                      : "border-warning/40 bg-warning/15 text-warning"
                  }
                >
                  {info?.registrada ? "Registrada" : "Sin registrar"}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{cfg.ayuda}</p>

              <dl className="mt-4 space-y-1 rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Identificador guardado</dt>
                  <dd className="font-mono">
                    {info?.clientId || (info?.registrada ? "Definido en el servidor" : "—")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Secreto</dt>
                  <dd className="flex items-center gap-1 font-mono">
                    <EyeOff className="size-3" />
                    {info?.pista || (info?.registrada ? "Oculto" : "—")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Última rotación</dt>
                  <dd>
                    {info?.actualizado
                      ? new Date(info.actualizado).toLocaleString("es-PA")
                      : "Sin registro"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Permisos solicitados</dt>
                  <dd className="text-right">
                    {proveedor === "meta"
                      ? (estado?.scopes.instagram ?? []).join(", ")
                      : (estado?.scopes.tiktok ?? []).join(", ")}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor={`${proveedor}-id`}>{cfg.etiquetaId}</Label>
                  <Input
                    id={`${proveedor}-id`}
                    autoComplete="off"
                    placeholder={info?.clientId || "Identificador de la app"}
                    value={valores[`${proveedor}-id`] ?? ""}
                    onChange={(e) =>
                      setValores((v) => ({ ...v, [`${proveedor}-id`]: e.target.value }))
                    }
                    disabled={!puede}
                  />
                </div>
                <div>
                  <Label htmlFor={`${proveedor}-secret`}>{cfg.etiquetaSecreto}</Label>
                  <Input
                    id={`${proveedor}-secret`}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Pega el secreto para registrarlo o rotarlo"
                    value={valores[`${proveedor}-secret`] ?? ""}
                    onChange={(e) =>
                      setValores((v) => ({ ...v, [`${proveedor}-secret`]: e.target.value }))
                    }
                    disabled={!puede}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!puede || guardando === proveedor}
                  onClick={() => void enviar(proveedor)}
                >
                  {guardando === proveedor ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {info?.registrada ? "Rotar credenciales" : "Registrar credenciales"}
                </Button>
                {!puede ? (
                  <p className="text-xs text-muted-foreground">
                    Solo un administrador o gestor de la empresa puede registrar o rotar credenciales.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, EyeOff, ListChecks, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { AsistenteMeta } from "@/components/AsistenteMeta";

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
  errorComponent: ErrorCredenciales,
});

/** Evita que un fallo puntual del servidor tumbe toda la aplicación. */
function ErrorCredenciales({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell
      titulo="Credenciales de apps"
      descripcion="No pudimos cargar esta pantalla. Reintenta; si el problema sigue, vuelve a iniciar sesión."
    >
      <section className="panel border-destructive/40 p-5">
        <h2 className="font-display text-base font-bold">Credenciales no disponibles temporalmente</h2>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={reset}>
          <RefreshCw className="size-4" /> Reintentar
        </Button>
      </section>
    </AppShell>
  );
}


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

const PASOS = [
  {
    titulo: "Meta Business (Facebook e Instagram)",
    pasos: [
      "Entra a developers.facebook.com con la cuenta que administra la página de la empresa y crea una app tipo Business.",
      "En Productos agrega Facebook Login for Business y, en su configuración, pega la URL de retorno de Meta en «URI de redireccionamiento de OAuth válidos».",
      "En Permisos y funciones solicita pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic e instagram_content_publish.",
      "Vincula la página de Facebook y la cuenta de Instagram profesional de la empresa en Meta Business Suite.",
      "En Configuración → Básica copia el App ID y el App Secret y pégalos arriba en META_APP_ID y META_APP_SECRET.",
      "Vuelve a Conexiones y autoriza Facebook e Instagram por separado.",
    ],
  },
  {
    titulo: "TikTok for Developers",
    pasos: [
      "Convierte la cuenta de TikTok a cuenta Business desde la app (Configuración → Cuenta → Cambiar a cuenta Business).",
      "Entra a developers.tiktok.com, crea una app y verifica la propiedad del dominio de la app.",
      "Agrega Login Kit y pega la URL de retorno de TikTok en Redirect URI.",
      "Solicita Content Posting API con los alcances video.upload y video.publish (la aprobación puede tardar días).",
      "Copia Client Key y Client Secret y pégalos arriba en TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET.",
      "Vuelve a Conexiones y autoriza TikTok; quedará como «autorizada» hasta que TikTok apruebe la API de publicación.",
    ],
  },
];

function Credenciales() {
  const { empresa, empresaId } = useEmpresa();
  const origen = typeof window === "undefined" ? "https://panama507.lovable.app" : window.location.origin;
  const queryClient = useQueryClient();

  const {
    data: estado,
    error: errorEstado,
    isLoading: cargandoEstado,
    refetch: recargarEstado,
    isFetching: recargando,
  } = useQuery({
    queryKey: ["credenciales-oauth", empresaId],
    queryFn: () => estadoCredenciales({ data: { empresaId } }),
    enabled: Boolean(empresaId),
    retry: 1,
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
      {errorEstado ? (
        <section className="panel mb-4 border-destructive/40 p-5">
          <h2 className="font-display text-base font-bold">No se pudo cargar el estado de las credenciales</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {(errorEstado as Error).message ||
              "La sesión pudo expirar o el servidor no respondió. Reintenta; si persiste, vuelve a iniciar sesión."}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            disabled={recargando}
            onClick={() => void recargarEstado()}
          >
            {recargando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Reintentar
          </Button>
        </section>
      ) : null}

      {cargandoEstado ? (
        <div className="panel mb-4 flex items-center gap-2 p-5 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Cargando el estado de las apps…
        </div>
      ) : null}

      <AsistenteMeta
        estado={estado?.meta}
        puedeAdministrar={puede}
        origen={origen}
      />



      <div className="mt-4 grid gap-4 lg:grid-cols-2">

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

      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ListChecks className="size-5 text-primary" /> Cómo crear las apps paso a paso
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Registra estas URL de retorno tal cual en cada plataforma; sin ellas la autorización falla.
        </p>
        <div className="mt-3 space-y-2">
          {[
            { etiqueta: "URL de retorno Meta", valor: `${origen}/api/public/oauth/meta/callback` },
            { etiqueta: "URL de retorno TikTok", valor: `${origen}/api/public/oauth/tiktok/callback` },
          ].map((u) => (
            <div
              key={u.etiqueta}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 p-3"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{u.etiqueta}</p>
                <p className="truncate font-mono text-xs">{u.valor}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(u.valor);
                  toast.success("URL copiada");
                }}
              >
                <Copy className="size-3.5" /> Copiar
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {PASOS.map((bloque) => (
            <div key={bloque.titulo}>
              <h3 className="font-display text-sm font-bold">{bloque.titulo}</h3>
              <ol className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
                {bloque.pasos.map((p, i) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}


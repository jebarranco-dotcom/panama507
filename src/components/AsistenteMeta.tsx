import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  History,
  Loader2,
  RotateCw,
  ShieldQuestion,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmpresa } from "@/lib/empresa";
import {
  guardarCredenciales,
  historialVerificaciones,
  verificarCredenciales,
} from "@/lib/oauth.functions";


type EstadoMeta = {
  registrada: boolean;
  clientId: string;
  pista: string;
  verificada: boolean;
  verificadaAt: string | null;
  detalleVerificacion: string;
};

const PERMISOS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

const PASOS = [
  "Crear la app",
  "URL de retorno",
  "Permisos",
  "App ID y secreto",
  "Verificación",
] as const;

export function AsistenteMeta({
  estado,
  puedeAdministrar,
  origen,
}: {
  estado: EstadoMeta | undefined;
  puedeAdministrar: boolean;
  origen: string;
}) {
  const { empresa, empresaId } = useEmpresa();
  const queryClient = useQueryClient();
  const guardar = useServerFn(guardarCredenciales);
  const verificar = useServerFn(verificarCredenciales);

  const [paso, setPaso] = useState(0);
  const [confirmado, setConfirmado] = useState<Record<number, boolean>>({});
  const [appId, setAppId] = useState("");
  const [secreto, setSecreto] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; detalle: string } | null>(
    estado?.verificada ? { ok: true, detalle: estado.detalleVerificacion } : null,
  );

  const {
    data: historial = [],
    isFetching: cargandoHistorial,
    refetch: refetchHistorial,
  } = useQuery({
    queryKey: ["verificaciones-meta", empresaId],
    queryFn: () => historialVerificaciones({ data: { empresaId, proveedor: "meta" } }),
  });

  const redirectUri = `${origen}/api/public/oauth/meta/callback`;
  const listo = estado?.verificada ?? false;


  const copiar = (valor: string) => {
    void navigator.clipboard.writeText(valor);
    toast.success("Copiado al portapapeles");
  };

  const registrar = async () => {
    const id = appId.trim();
    const sec = secreto.trim();
    if (id.length < 6 || sec.length < 16) {
      toast.error("Datos incompletos", {
        description: "El App ID debe tener al menos 6 caracteres y el App Secret 16.",
      });
      return;
    }
    setTrabajando(true);
    try {
      await guardar({ data: { empresaId, proveedor: "meta", clientId: id, clientSecret: sec } });
      setSecreto("");
      await queryClient.invalidateQueries({ queryKey: ["credenciales-oauth", empresaId] });
      toast.success("Credenciales guardadas cifradas");
      setPaso(4);
    } catch (e) {
      toast.error("No se pudo guardar", { description: (e as Error).message });
    } finally {
      setTrabajando(false);
    }
  };

  const comprobar = async () => {
    setTrabajando(true);
    try {
      const r = await verificar({ data: { empresaId, proveedor: "meta" } });
      setResultado({ ok: r.ok, detalle: r.detalle });
      await queryClient.invalidateQueries({ queryKey: ["credenciales-oauth", empresaId] });
      await refetchHistorial();
      if (r.ok) toast.success("Listo para autorizar");
      else toast.error("Verificación fallida", { description: r.detalle });
    } catch (e) {

      toast.error("No se pudo verificar", { description: (e as Error).message });
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Sparkles className="size-5 text-primary" /> Asistente Meta Business paso a paso
        </h2>
        <Badge
          variant="outline"
          className={
            listo
              ? "border-success/40 bg-success/15 text-success"
              : estado?.registrada
                ? "border-warning/40 bg-warning/15 text-warning"
                : "border-border text-muted-foreground"
          }
        >
          {listo
            ? "Listo para autorizar"
            : estado?.registrada
              ? "Registrada, sin verificar"
              : "Sin registrar"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {empresa.nombre}: completa los cinco pasos. Conexiones habilita los botones de Facebook e
        Instagram solo cuando Meta confirma que el App ID y el App Secret son válidos.
      </p>

      <ol className="mt-4 flex flex-wrap gap-2">
        {PASOS.map((p, i) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => setPaso(i)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                i === paso
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-background/60 text-[10px] font-bold">
                {i + 1}
              </span>
              {p}
              {(i < 3 && confirmado[i]) || (i === 3 && estado?.registrada) || (i === 4 && listo) ? (
                <Check className="size-3 text-success" />
              ) : null}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
        {paso === 0 ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">1. Crea la app de tipo Business</p>
            <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>Entra a developers.facebook.com con la cuenta que administra la página.</li>
              <li>Mis apps → Crear app → tipo «Business».</li>
              <li>Agrega el producto «Facebook Login for Business».</li>
              <li>
                Vincula en Meta Business Suite la página de Facebook y la cuenta profesional de
                Instagram de la empresa.
              </li>
            </ul>
          </div>
        ) : null}

        {paso === 1 ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">2. Registra la URL de retorno exacta</p>
            <p className="text-xs text-muted-foreground">
              En Facebook Login for Business → Configuración → «URI de redireccionamiento de OAuth
              válidos», pega esta URL tal cual:
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-3">
              <p className="min-w-0 truncate font-mono text-xs">{redirectUri}</p>
              <Button size="sm" variant="outline" onClick={() => copiar(redirectUri)}>
                <Copy className="size-3.5" /> Copiar
              </Button>
            </div>
          </div>
        ) : null}

        {paso === 2 ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">3. Solicita los permisos de publicación</p>
            <p className="text-xs text-muted-foreground">
              En Permisos y funciones agrega estos cinco permisos; sin ellos la red queda
              «autorizada» pero no puede publicar.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PERMISOS.map((p) => (
                <Badge key={p} variant="outline" className="font-mono text-[11px]">
                  {p}
                </Badge>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => copiar(PERMISOS.join(", "))}>
              <Copy className="size-3.5" /> Copiar lista
            </Button>
          </div>
        ) : null}

        {paso === 3 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">4. Pega el App ID y el App Secret</p>
            <p className="text-xs text-muted-foreground">
              Están en Configuración → Básica de tu app. El secreto se guarda cifrado y nunca se
              vuelve a mostrar.
            </p>
            <div>
              <Label htmlFor="asistente-meta-id">App ID</Label>
              <Input
                id="asistente-meta-id"
                autoComplete="off"
                placeholder={estado?.clientId || "Ej. 1234567890123456"}
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                disabled={!puedeAdministrar}
              />
            </div>
            <div>
              <Label htmlFor="asistente-meta-secret">App Secret</Label>
              <Input
                id="asistente-meta-secret"
                type="password"
                autoComplete="new-password"
                placeholder={estado?.pista ? `Guardado (${estado.pista})` : "Pega el App Secret"}
                value={secreto}
                onChange={(e) => setSecreto(e.target.value)}
                disabled={!puedeAdministrar}
              />
            </div>
            <Button
              className="w-full"
              disabled={!puedeAdministrar || trabajando}
              onClick={() => void registrar()}
            >
              {trabajando ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Guardar y continuar
            </Button>
          </div>
        ) : null}

        {paso === 4 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">5. Verifica con Meta</p>
            <p className="text-xs text-muted-foreground">
              Pedimos un token de aplicación a Meta con el App ID y el App Secret guardados. No
              publica nada: solo confirma que el par es válido y deja la app «lista para autorizar».
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="flex-1"
                disabled={!puedeAdministrar || trabajando || !estado?.registrada}
                onClick={() => void comprobar()}
              >
                {trabajando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldQuestion className="size-4" />
                )}
                {listo || resultado ? "Reintentar verificación con Meta" : "Verificar credenciales con Meta"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Actualizar historial de intentos"
                disabled={cargandoHistorial}
                onClick={() => void refetchHistorial()}
              >
                <RotateCw className={`size-4 ${cargandoHistorial ? "animate-spin" : ""}`} />
              </Button>
            </div>
            {resultado ? (
              <div
                className={`flex gap-2 rounded-lg border p-3 text-xs ${
                  resultado.ok
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                {resultado.ok ? (
                  <BadgeCheck className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                )}
                <span className="leading-relaxed">{resultado.detalle}</span>
              </div>
            ) : null}
            {estado?.verificadaAt ? (
              <p className="text-xs text-muted-foreground">
                Verificada el {new Date(estado.verificadaAt).toLocaleString("es-PA")}.
              </p>
            ) : null}

            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold">
                <History className="size-3.5 text-primary" /> Historial de intentos
              </p>
              {historial.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Todavía no hay intentos de verificación registrados para {empresa.nombre}.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {historial.map((h) => {
                    const bien = h.estado.endsWith("_ok");
                    return (
                      <li key={h.id} className="flex gap-2 text-xs leading-relaxed">
                        {bien ? (
                          <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-success" />
                        ) : (
                          <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="text-muted-foreground">
                          <span className="font-mono">
                            {new Date(h.fecha).toLocaleString("es-PA")}
                          </span>{" "}
                          — {h.mensaje}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {listo ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/conexiones">
                  Ir a Conexiones y autorizar <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={paso === 0}
          onClick={() => setPaso((p) => Math.max(0, p - 1))}
        >
          <ArrowLeft className="size-4" /> Anterior
        </Button>
        {paso < 3 ? (
          <Button
            size="sm"
            onClick={() => {
              setConfirmado((c) => ({ ...c, [paso]: true }));
              setPaso((p) => p + 1);
            }}
          >
            Ya lo hice <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={paso === 4}
            onClick={() => setPaso(4)}
          >
            Siguiente <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      {!puedeAdministrar ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Solo un administrador o gestor de la empresa puede registrar y verificar credenciales.
        </p>
      ) : null}
    </section>
  );
}

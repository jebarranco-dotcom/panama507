import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

function rutaDeRetorno() {
  const valor = new URLSearchParams(window.location.search).get("returnTo");
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}

function Acceso() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: rutaDeRetorno() });
    });
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo,
          password: clave,
        });
        if (error) throw error;
        await navigate({ to: rutaDeRetorno() });
      } else {
        const { error } = await supabase.auth.signUp({
          email: correo,
          password: clave,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Cuenta creada", {
          description: "Revisa tu correo si se requiere confirmación e inicia sesión.",
        });
        setModo("entrar");
      }
    } catch (error) {
      toast.error("No se pudo completar el acceso", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="panel w-full max-w-md p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold">Centro inmobiliario de redes</p>
            <p className="text-xs text-muted-foreground">Centro interno de redes sociales</p>
          </div>
        </div>

        <h1 className="mt-6 font-display text-xl font-bold">
          {modo === "entrar" ? "Iniciar sesión" : "Crear cuenta del equipo"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El panel, la bandeja de mensajes y los informes son de uso interno.
        </p>

        <form className="mt-6 space-y-4" onSubmit={enviar}>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              autoComplete="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clave">Contraseña</Label>
            <Input
              id="clave"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              minLength={8}
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando ? <Loader2 className="size-4 animate-spin" /> : null}
            {modo === "entrar" ? "Entrar" : "Registrarme"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "registrar" : "entrar")}
        >
          {modo === "entrar" ? "No tengo cuenta todavía" : "Ya tengo cuenta"}
        </button>

        <button
          type="button"
          className="mt-2 w-full text-sm text-primary underline-offset-4 hover:underline disabled:opacity-60"
          disabled={cargando}
          onClick={async () => {
            if (!correo) {
              toast.error("Escribe tu correo para enviarte el enlace");
              return;
            }
            setCargando(true);
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(correo, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) throw error;
              toast.success("Te enviamos un enlace de recuperación", {
                description: "Revisa la bandeja de entrada y el correo no deseado.",
              });
            } catch (error) {
              toast.error("No se pudo enviar el enlace", {
                description: error instanceof Error ? error.message : undefined,
              });
            } finally {
              setCargando(false);
            }
          }}
        >
          Olvidé mi contraseña
        </button>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso interno | Centro inmobiliario de redes" },
      {
        name: "description",
        content:
          "Inicia sesión para administrar el calendario de contenido, la bandeja de mensajes y los informes diarios de RENTELO FACIL y PANAMA REAL ESTATE.",
      },
      { property: "og:title", content: "Acceso interno | Centro inmobiliario de redes" },
      {
        property: "og:description",
        content: "Panel privado de gestión de redes sociales inmobiliarias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acceso,
});

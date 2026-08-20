import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

function NuevaClave() {
  const navigate = useNavigate();
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [listoParaCambiar, setListoParaCambiar] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "PASSWORD_RECOVERY" || sesion) setListoParaCambiar(true);
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setListoParaCambiar(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clave !== confirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: clave });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      await navigate({ to: "/" });
    } catch (error) {
      toast.error("No se pudo actualizar la contraseña", {
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
            <p className="text-xs text-muted-foreground">Restablecer contraseña</p>
          </div>
        </div>

        <h1 className="mt-6 font-display text-xl font-bold">Define tu nueva contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {listoParaCambiar
            ? "Escribe una contraseña de al menos 8 caracteres."
            : "Abre este enlace desde el correo de recuperación para continuar."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={enviar}>
          <div className="space-y-2">
            <Label htmlFor="clave">Nueva contraseña</Label>
            <Input
              id="clave"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar contraseña</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={cargando || !listoParaCambiar}>
            {cargando ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar contraseña
          </Button>
        </form>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña | Centro inmobiliario de redes" },
      {
        name: "description",
        content:
          "Define una nueva contraseña para acceder al panel interno de gestión de redes sociales y mensajería.",
      },
      { property: "og:title", content: "Restablecer contraseña | Centro inmobiliario de redes" },
      {
        property: "og:description",
        content: "Recupera el acceso al panel privado de gestión de redes sociales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NuevaClave,
});

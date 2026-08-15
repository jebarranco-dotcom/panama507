import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { IconoRed } from "@/components/Estado";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { PILARES, REDES } from "@/lib/estrategia";
import { cuentasQuery } from "@/lib/queries";

const REQUISITOS: Record<string, string> = {
  facebook: "Página de Facebook + app de Meta Business con permisos pages_manage_posts.",
  instagram: "Cuenta profesional vinculada a la página y permiso instagram_content_publish.",
  tiktok: "Cuenta TikTok Business y acceso al Content Posting API.",
};

export function Conexiones() {
  const qc = useQueryClient();
  const { data: cuentas = [] } = useQuery(cuentasQuery);

  const alternar = useMutation({
    mutationFn: async ({ id, conectada }: { id: string; conectada: boolean }) => {
      const { error } = await supabase
        .from("cuentas_sociales")
        .update({ conectada, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cuentas_sociales"] });
      toast.success("Estado de conexión actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Link2 className="size-5 text-primary" /> Conexión de redes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mientras una red esté desconectada, sus piezas quedan en la cola interna listas para
          publicar en un clic. Al activar la credencial, la publicación se envía automáticamente a su
          hora.
        </p>
        <div className="mt-4 space-y-3">
          {cuentas.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4"
            >
              <IconoRed red={c.red} className="size-5" />
              <div className="min-w-40 flex-1">
                <p className="text-sm font-semibold">
                  {REDES[c.red as keyof typeof REDES]?.nombre ?? c.red}
                </p>
                <p className="text-xs text-muted-foreground">{c.usuario}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{c.seguidores.toLocaleString("es-PA")} seguidores</p>
                <p>{c.alcance_mensual.toLocaleString("es-PA")} alcance/mes</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    c.conectada
                      ? "border-success/40 bg-success/15 text-success"
                      : "border-warning/40 bg-warning/15 text-warning"
                  }
                >
                  {c.conectada ? "Conectada" : "Pendiente"}
                </Badge>
                <Switch
                  checked={c.conectada}
                  onCheckedChange={(conectada) => alternar.mutate({ id: c.id, conectada })}
                />
              </div>
              <p className="w-full text-xs text-muted-foreground">{REQUISITOS[c.red]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <ShieldCheck className="size-5 text-primary" /> Estrategia de contenido
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mezcla diaria que sostiene la captación: mostrar inventario, generar confianza y educar al
          comprador o inquilino.
        </p>
        <ul className="mt-4 space-y-3">
          {PILARES.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{p.nombre}</p>
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {p.peso}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.descripcion}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

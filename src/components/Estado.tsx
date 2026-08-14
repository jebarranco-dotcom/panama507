import { Facebook, Instagram, Music2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ETIQUETAS_ESTADO } from "@/lib/estrategia";
import { cn } from "@/lib/utils";

export function IconoRed({ red, className }: { red: string; className?: string }) {
  const Icon = red === "facebook" ? Facebook : red === "tiktok" ? Music2 : Instagram;
  const color =
    red === "facebook" ? "text-facebook" : red === "tiktok" ? "text-tiktok" : "text-instagram";
  return <Icon className={cn("size-4", color, className)} />;
}

export function EtiquetaRed({ red }: { red: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-muted-foreground">
      <IconoRed red={red} />
      {red}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    publicado: "border-success/40 bg-success/15 text-success",
    programado: "border-accent/40 bg-accent/15 text-accent",
    en_cola: "border-warning/40 bg-warning/15 text-warning",
    nuevo: "border-primary/40 bg-primary/15 text-primary",
    en_proceso: "border-warning/40 bg-warning/15 text-warning",
    respondido: "border-success/40 bg-success/15 text-success",
    cerrado: "border-border bg-secondary text-muted-foreground",
    fallido: "border-destructive/40 bg-destructive/15 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", estilos[estado] ?? "")}>
      {ETIQUETAS_ESTADO[estado] ?? estado.replace("_", " ")}
    </Badge>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EstadoBadge, IconoRed } from "@/components/Estado";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { REDES, type Red } from "@/lib/estrategia";
import { colaboradoresQuery, mensajesQuery } from "@/lib/queries";

export const Route = createFileRoute("/colaboradores")({
  head: () => ({
    meta: [
      { title: "Colaboradores | RENTELO FACIL" },
      {
        name: "description",
        content:
          "Equipo de RENTELO FACIL: asesores, community managers, redes asignadas y desempeño en leads atendidos y cerrados.",
      },
      { property: "og:title", content: "Colaboradores | RENTELO FACIL" },
      {
        property: "og:description",
        content: "Gestiona el equipo, sus redes asignadas y su desempeño en captación de clientes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ColaboradoresPage,
});

const REDES_LISTA = Object.keys(REDES) as Red[];

function ColaboradoresPage() {
  const qc = useQueryClient();
  const { data: equipo = [], isLoading } = useQuery(colaboradoresQuery);
  const { data: mensajes = [] } = useQuery(mensajesQuery);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    rol: "Asesor inmobiliario",
    correo: "",
    telefono: "",
    whatsapp: "",
    redes: [] as string[],
  });

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["colaboradores"] });
  };

  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("colaboradores").insert({
        nombre: form.nombre,
        rol: form.rol,
        correo: form.correo,
        telefono: form.telefono,
        whatsapp: form.whatsapp || form.telefono,
        redes_asignadas: form.redes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Colaborador agregado");
      setAbierto(false);
      setForm({
        nombre: "",
        rol: "Asesor inmobiliario",
        correo: "",
        telefono: "",
        whatsapp: "",
        redes: [],
      });
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarActivo = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from("colaboradores").update({ activo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Colaborador eliminado");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendientesPorColaborador = (id: string) =>
    mensajes.filter((m) => m.colaborador_id === id && m.estado !== "cerrado").length;

  return (
    <AppShell
      titulo="Colaboradores"
      descripcion="Equipo responsable del contenido, la atención de mensajes y el cierre de clientes."
      acciones={
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Agregar colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo colaborador</DialogTitle>
              <DialogDescription>
                Asigna las redes que atenderá y sus datos de contacto para el seguimiento de leads.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Marta Gómez"
                />
              </div>
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Input
                  id="rol"
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+507 6000-0000"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+50760000000"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Redes asignadas</Label>
                <div className="mt-2 flex gap-2">
                  {REDES_LISTA.map((red) => {
                    const activa = form.redes.includes(red);
                    return (
                      <Button
                        key={red}
                        type="button"
                        variant={activa ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setForm({
                            ...form,
                            redes: activa
                              ? form.redes.filter((r) => r !== red)
                              : [...form.redes, red],
                          })
                        }
                      >
                        <IconoRed red={red} />
                        {REDES[red].nombre}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => crear.mutate()}
                disabled={!form.nombre || crear.isPending}
              >
                {crear.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <ResumenCard titulo="Colaboradores activos" valor={equipo.filter((c) => c.activo).length} />
        <ResumenCard
          titulo="Leads atendidos"
          valor={equipo.reduce((s, c) => s + c.leads_atendidos, 0)}
        />
        <ResumenCard
          titulo="Leads cerrados"
          valor={equipo.reduce((s, c) => s + c.leads_cerrados, 0)}
        />
      </div>

      <div className="panel mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Redes</TableHead>
              <TableHead className="text-right">Publicaciones</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Cierres</TableHead>
              <TableHead className="text-right">Pendientes</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Cargando equipo…
                </TableCell>
              </TableRow>
            ) : (
              equipo.map((c) => {
                const cierre = c.leads_atendidos
                  ? Math.round((c.leads_cerrados / c.leads_atendidos) * 100)
                  : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-secondary text-xs font-semibold">
                            {c.nombre
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.rol} · {c.correo || "sin correo"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {c.redes_asignadas.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          c.redes_asignadas.map((r) => <IconoRed key={r} red={r} />)
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{c.publicaciones_asignadas}</TableCell>
                    <TableCell className="text-right">{c.leads_atendidos}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        {c.leads_cerrados} · {cierre}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pendientesPorColaborador(c.id) > 0 ? (
                        <EstadoBadge estado="en_proceso" />
                      ) : (
                        <span className="text-xs text-muted-foreground">al día</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={c.activo}
                        onCheckedChange={(activo) =>
                          alternarActivo.mutate({ id: c.id, activo })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminar.mutate(c.id)}
                        aria-label={`Eliminar ${c.nombre}`}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

function ResumenCard({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-2 font-display text-3xl font-bold">{valor}</p>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type Empresa = {
  id: string;
  slug: string;
  nombre: string;
  giro: string;
  tono: string;
  whatsapp: string;
  zonas: string;
  color_primario: string;
  color_acento: string;
  logo_url: string | null;
  activa: boolean;
  zona_horaria: string;
};

const CLAVE = "empresa_activa";

export const empresasQuery = {
  queryKey: ["empresas"],
  queryFn: async (): Promise<Empresa[]> => {
    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id, slug, nombre, giro, tono, whatsapp, zonas, color_primario, color_acento, logo_url, activa, zona_horaria",
      )
      .order("nombre");
    if (error) throw error;
    return data as Empresa[];
  },
};

type Ctx = {
  empresa: Empresa;
  empresaId: string;
  empresas: Empresa[];
  cambiarEmpresa: (id: string) => void;
};

const EmpresaContext = createContext<Ctx | null>(null);

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error("useEmpresa debe usarse dentro de EmpresaProvider");
  return ctx;
}

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { data: empresas, isLoading, error } = useQuery(empresasQuery);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  useEffect(() => {
    setSeleccion(localStorage.getItem(CLAVE));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !empresas || empresas.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Tu cuenta todavía no tiene acceso a ninguna empresa. Pide al administrador que te
          asigne a RENTELO FACIL o PANAMA REAL ESTATE.
        </p>
      </div>
    );
  }

  const empresa = empresas.find((e) => e.id === seleccion) ?? empresas[0]!;

  const cambiarEmpresa = (id: string) => {
    localStorage.setItem(CLAVE, id);
    setSeleccion(id);
  };

  return (
    <EmpresaContext.Provider
      value={{ empresa, empresaId: empresa.id, empresas, cambiarEmpresa }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

import { crearClienteServidor } from "./rutina.server";
import { estrategiaDe, type Red } from "./estrategia";

export type FilaProgramacion = {
  red: Red;
  hora: string;
  pilar: string;
  formato: string;
  activo: boolean;
};

const REDES_ORDEN: Red[] = ["instagram", "facebook", "tiktok"];

/** Programación efectiva de una empresa: lo guardado, con respaldo en la estrategia base. */
export async function programacionDe(empresaId: string): Promise<FilaProgramacion[]> {
  const supabase = crearClienteServidor();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("slug")
    .eq("id", empresaId)
    .maybeSingle();
  const base = estrategiaDe(empresa?.slug ?? "").plan;

  const { data } = await supabase
    .from("programacion_redes")
    .select("red, hora, pilar, formato, activo")
    .eq("empresa_id", empresaId);

  return REDES_ORDEN.map((red) => {
    const guardada = (data ?? []).find((f) => f.red === red);
    const defecto = base.find((b) => b.red === red);
    return {
      red,
      hora: guardada?.hora || defecto?.hora || "09:00",
      pilar: guardada?.pilar || defecto?.pilar || "",
      formato: guardada?.formato || defecto?.formato || "",
      activo: guardada ? guardada.activo : true,
    };
  });
}

export async function guardarProgramacionDe(empresaId: string, filas: FilaProgramacion[]) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from("programacion_redes").upsert(
    filas.map((f) => ({
      empresa_id: empresaId,
      red: f.red,
      hora: f.hora,
      pilar: f.pilar,
      formato: f.formato,
      activo: f.activo,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "empresa_id,red" },
  );
  if (error) throw new Error(error.message);
}

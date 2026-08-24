import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EmpresaInput, GuardarProgramacionInput } from "@/lib/entradas.schemas";

/** Programación diaria (hora, pilar y formato) por empresa y red. */
export const leerProgramacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMiembro, puedeAdministrar } = await import("@/lib/permisos.server");
    await asegurarMiembro(context.supabase, data.empresaId);
    const { programacionDe } = await import("@/lib/programacion.server");
    return {
      filas: await programacionDe(data.empresaId),
      puedeAdministrar: await puedeAdministrar(context.supabase, context.userId, data.empresaId),
    };
  });

/** Guarda la hora de publicación por red para una empresa. */
export const guardarProgramacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GuardarProgramacionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { guardarProgramacionDe, programacionDe } = await import("@/lib/programacion.server");
    await guardarProgramacionDe(data.empresaId, data.filas);
    return { filas: await programacionDe(data.empresaId) };
  });

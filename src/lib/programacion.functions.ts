import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EmpresaInput = z.object({ empresaId: z.string().uuid() });

const GuardarInput = z.object({
  empresaId: z.string().uuid(),
  filas: z
    .array(
      z.object({
        red: z.enum(["facebook", "instagram", "tiktok"]),
        hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:MM en 24 horas."),
        pilar: z.string().trim().max(60),
        formato: z.string().trim().max(40),
        activo: z.boolean(),
      }),
    )
    .min(1)
    .max(3),
});

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
  .inputValidator((input: unknown) => GuardarInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { guardarProgramacionDe, programacionDe } = await import("@/lib/programacion.server");
    await guardarProgramacionDe(data.empresaId, data.filas);
    return { filas: await programacionDe(data.empresaId) };
  });

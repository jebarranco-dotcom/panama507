import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RedInput } from "@/lib/entradas.schemas";

/** Ejecuta una publicación de prueba para una empresa y red concretas. */
export const publicarPrueba = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RedInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { publicarPrueba: ejecutar } = await import("@/lib/prueba.server");
    return ejecutar(data.empresaId, data.red);
  });

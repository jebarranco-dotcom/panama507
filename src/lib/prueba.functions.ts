import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PruebaInput = z.object({
  empresaId: z.string().uuid(),
  red: z.enum(["facebook", "instagram", "tiktok"]),
});

/** Ejecuta una publicación de prueba para una empresa y red concretas. */
export const publicarPrueba = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PruebaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { publicarPrueba: ejecutar } = await import("@/lib/prueba.server");
    return ejecutar(data.empresaId, data.red);
  });

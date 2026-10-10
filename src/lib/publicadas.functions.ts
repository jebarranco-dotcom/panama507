import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EmpresaInput, FotoInput } from "@/lib/entradas.schemas";

/** Lista las publicaciones reales en Facebook e Instagram con su enlace. */
export const publicadasReales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMiembro } = await import("@/lib/permisos.server");
    await asegurarMiembro(context.supabase, data.empresaId);
    const { listarPublicadasReales } = await import("@/lib/publicadas.server");
    return listarPublicadasReales(data.empresaId);
  });

/** Asigna una foto real (enlace https público) a una pieza antes de enviarla. */
export const guardarFoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FotoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("publicaciones")
      .update({ media_url: data.mediaUrl, error_publicacion: "" })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

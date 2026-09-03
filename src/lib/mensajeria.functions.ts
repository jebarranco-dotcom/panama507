import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BandejaInput } from "./oauth.schemas";

/** Descarga las conversaciones reales de Facebook o Instagram hacia la bandeja de la empresa. */
export const sincronizarConversaciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BandejaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMembresia } = await import("@/lib/permisos.server");
    await asegurarMembresia(context.supabase, context.userId, data.empresaId);
    const { sincronizarBandeja } = await import("@/lib/mensajeria.server");
    const redes: ("facebook" | "instagram")[] =
      data.red === "todas" ? ["facebook", "instagram"] : [data.red];
    const resultados = [];
    for (const red of redes) {
      resultados.push(await sincronizarBandeja(data.empresaId, red));
    }
    return { resultados };
  });

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

type Cliente = SupabaseClient<Database>;

/** Verifica que el usuario pertenezca a la empresa (RLS ya lo limita, esto da un error claro). */
export async function asegurarMiembro(supabase: Cliente, empresaId: string) {
  const { data, error } = await supabase
    .from("empresa_usuarios")
    .select("id")
    .eq("empresa_id", empresaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No tienes acceso a esta empresa.");
}

export async function puedeAdministrar(supabase: Cliente, userId: string, empresaId: string) {
  const { data } = await supabase
    .from("empresa_roles")
    .select("rol")
    .eq("empresa_id", empresaId)
    .eq("user_id", userId);
  return (data ?? []).some((r) => r.rol === "admin" || r.rol === "gestor");
}

export async function asegurarAdministrador(
  supabase: Cliente,
  userId: string,
  empresaId: string,
) {
  await asegurarMiembro(supabase, empresaId);
  if (!(await puedeAdministrar(supabase, userId, empresaId))) {
    throw new Error("Solo un administrador o gestor de la empresa puede realizar esta acción.");
  }
}

/** Origen público de la app, válido tanto en vista previa como en producción. */
export function origenPublico(request: Request | undefined): string {
  if (!request) throw new Error("La acción debe iniciarse desde la aplicación.");
  const url = new URL(request.url);
  const reenviado = request.headers.get("x-forwarded-host");
  if (url.hostname === "localhost" && reenviado) return `https://${reenviado}`;
  return url.origin;
}

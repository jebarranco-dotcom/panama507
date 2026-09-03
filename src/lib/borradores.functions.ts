import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  AprobacionInput,
  EditarBorradorInput,
  EmpresaInput,
  PiezaInput,
} from "@/lib/entradas.schemas";

/** Configuración de revisión y resumen del programador para la empresa. */
export const estadoProgramador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMiembro, puedeAdministrar } = await import("@/lib/permisos.server");
    await asegurarMiembro(context.supabase, data.empresaId);
    const { ahoraPanama } = await import("@/lib/publicador.server");
    const { data: empresa } = await context.supabase
      .from("empresas")
      .select("requiere_aprobacion")
      .eq("id", data.empresaId)
      .maybeSingle();
    const { programacionDe } = await import("@/lib/programacion.server");
    return {
      requiereAprobacion: empresa?.requiere_aprobacion ?? true,
      puedeAdministrar: await puedeAdministrar(context.supabase, context.userId, data.empresaId),
      ahora: ahoraPanama(),
      programacion: await programacionDe(data.empresaId),
    };
  });

/** Activa o desactiva la aprobación obligatoria antes de publicar. */
export const cambiarModoAprobacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AprobacionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { error } = await context.supabase
      .from("empresas")
      .update({ requiere_aprobacion: data.requiereAprobacion })
      .eq("id", data.empresaId);
    if (error) throw new Error(error.message);
    return { requiereAprobacion: data.requiereAprobacion };
  });

/** Guarda los cambios de un borrador antes de aprobarlo. */
export const editarBorrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EditarBorradorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { error } = await context.supabase
      .from("publicaciones")
      .update({
        titular: data.titular,
        copy: data.copy,
        cta: data.cta,
        hashtags: data.hashtags,
        media_url: data.mediaUrl,
        hora_programada: data.horaProgramada,
      })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Aprueba la pieza: el programador la enviará a la hora configurada. */
export const aprobarBorrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PiezaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { data: actualizada, error } = await context.supabase
      .from("publicaciones")
      .update({
        estado: "programado",
        aprobada_at: new Date().toISOString(),
        aprobada_por: context.userId,
        error_publicacion: "",
        intentos_publicacion: 0,
      })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId)
      .in("estado", ["borrador", "error"])
      .select("id");
    if (error) throw new Error(error.message);
    if (!actualizada?.length) {
      throw new Error("La pieza no está disponible para aprobación o ya fue procesada.");
    }
    return { ok: true };
  });

/** Devuelve una pieza aprobada a borrador para seguir editándola. */
export const devolverABorrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PiezaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { error } = await context.supabase
      .from("publicaciones")
      .update({ estado: "borrador", aprobada_at: null, aprobada_por: null })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Descarta la pieza sin publicarla. */
export const descartarBorrador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PiezaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { error } = await context.supabase
      .from("publicaciones")
      .update({ estado: "descartado", aprobada_at: null, aprobada_por: null })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Aprueba y envía la pieza de inmediato, sin esperar la hora programada. */
export const publicarAhora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PiezaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    await context.supabase
      .from("publicaciones")
      .update({
        estado: "programado",
        aprobada_at: new Date().toISOString(),
        aprobada_por: context.userId,
      })
      .eq("empresa_id", data.empresaId)
      .eq("id", data.publicacionId);
    const { enviarPieza } = await import("@/lib/publicador.server");
    return enviarPieza(data.empresaId, data.publicacionId);
  });

/** Corre el programador de inmediato para la empresa activa. */
export const correrProgramador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { ejecutarProgramador } = await import("@/lib/publicador.server");
    return ejecutarProgramador(data.empresaId);
  });

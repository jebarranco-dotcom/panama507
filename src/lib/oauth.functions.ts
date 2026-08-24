import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ActivoInput,
  CredencialInput,
  EmpresaInput,
  IniciarInput,
  ProveedorInput,
} from "@/lib/oauth.schemas";

export type ProveedorOAuth = "meta" | "tiktok";
export type RedOAuth = "facebook" | "instagram" | "tiktok";

/** Estado de las credenciales de app por empresa (sin exponer secretos). */
export const estadoCredenciales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMiembro, puedeAdministrar } = await import("@/lib/permisos.server");
    await asegurarMiembro(context.supabase, data.empresaId);
    const { resumenCredenciales, SCOPES_SOLICITADOS } = await import("@/lib/conexiones.server");
    return {
      ...(await resumenCredenciales(data.empresaId)),
      scopes: SCOPES_SOLICITADOS,
      puedeAdministrar: await puedeAdministrar(context.supabase, context.userId, data.empresaId),
    };
  });

/** Registra o rota las credenciales de la app de Meta o TikTok para una empresa. */
export const guardarCredenciales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CredencialInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { guardarCredencial, resumenCredenciales } = await import("@/lib/conexiones.server");
    await guardarCredencial(
      data.empresaId,
      data.proveedor,
      data.clientId,
      data.clientSecret,
      context.userId,
    );
    return resumenCredenciales(data.empresaId);
  });

/** Valida contra la plataforma que las credenciales guardadas sirvan para autorizar. */
export const verificarCredenciales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProveedorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { verificarCredencial, resumenCredenciales } = await import("@/lib/conexiones.server");
    const resultado = await verificarCredencial(data.empresaId, data.proveedor);
    return { ...resultado, estado: await resumenCredenciales(data.empresaId) };
  });

/** Bitácora de intentos de verificación/sincronización de la app por proveedor. */
export const historialVerificaciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProveedorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarMiembro } = await import("@/lib/permisos.server");
    await asegurarMiembro(context.supabase, data.empresaId);
    const { historialVerificacion } = await import("@/lib/conexiones.server");
    return historialVerificacion(data.empresaId, data.proveedor);
  });

/** Sincroniza las páginas de Facebook y cuentas de Instagram disponibles para la app verificada. */
export const sincronizarActivosMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmpresaInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { activosMeta } = await import("@/lib/conexiones.server");
    return activosMeta(data.empresaId);
  });

/** Asigna a la empresa la página de Facebook o la cuenta de Instagram elegida. */
export const elegirActivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ActivoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { elegirActivoMeta } = await import("@/lib/conexiones.server");
    return elegirActivoMeta(data.empresaId, data.red, data.cuentaId, data.cuentaNombre);
  });

/** Autoriza o reintenta los permisos de publicación de una página o cuenta concreta. */
export const autorizarActivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ActivoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { autorizarActivoMeta } = await import("@/lib/conexiones.server");
    return autorizarActivoMeta(data.empresaId, data.red, data.cuentaId, data.cuentaNombre);
  });




/** Construye la URL de autorización de la red indicada para abrirla en una ventana emergente. */
export const iniciarOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IniciarInput.parse(input))
  .handler(async ({ data, context }) => {
    const { asegurarAdministrador } = await import("@/lib/permisos.server");
    await asegurarAdministrador(context.supabase, context.userId, data.empresaId);
    const { PROVEEDOR_DE_RED, SCOPES_SOLICITADOS, leerCredencial, registrarEvento } = await import(
      "@/lib/conexiones.server"
    );
    const { firmarEstado } = await import("@/lib/cripto.server");
    const { origenPublico } = await import("@/lib/permisos.server");

    const proveedor = PROVEEDOR_DE_RED[data.red];
    const cred = await leerCredencial(data.empresaId, proveedor);
    if (!cred) {
      throw new Error(
        proveedor === "meta"
          ? "Falta registrar el ID y el secreto de la app de Meta Business para esta empresa."
          : "Falta registrar el client key y el client secret de la app de TikTok para esta empresa.",
      );
    }
    if (proveedor === "meta") {
      const { resumenCredenciales } = await import("@/lib/conexiones.server");
      const { meta } = await resumenCredenciales(data.empresaId);
      if (!meta.verificada) {
        throw new Error(
          "La app de Meta aún no está verificada. Completa el paso de verificación en Credenciales para dejarla lista para autorizar.",
        );
      }
    }


    const origen = origenPublico(getRequest());
    const redirectUri = `${origen}/api/public/oauth/${proveedor}/callback`;
    const estado = firmarEstado({
      empresaId: data.empresaId,
      red: data.red,
      proveedor,
      userId: context.userId,
    });
    const scopes = SCOPES_SOLICITADOS[data.red];

    const autorizar =
      proveedor === "meta"
        ? new URL("https://www.facebook.com/v21.0/dialog/oauth")
        : new URL("https://www.tiktok.com/v2/auth/authorize/");
    if (proveedor === "meta") {
      autorizar.searchParams.set("client_id", cred.clientId);
      autorizar.searchParams.set("scope", scopes.join(","));
    } else {
      autorizar.searchParams.set("client_key", cred.clientId);
      autorizar.searchParams.set("scope", scopes.join(","));
    }
    autorizar.searchParams.set("redirect_uri", redirectUri);
    autorizar.searchParams.set("response_type", "code");
    autorizar.searchParams.set("state", estado);

    await registrarEvento(
      data.empresaId,
      data.red,
      "pendiente",
      `Autorización iniciada solicitando: ${scopes.join(", ")}.`,
    );
    return { authorizationUrl: autorizar.toString() };
  });

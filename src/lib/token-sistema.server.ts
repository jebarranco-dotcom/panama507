import { descifrar } from "./cripto.server";
import {
  PERMISOS_REQUERIDOS,
  guardarResultado,
  registrarEventoProveedor,
  type ActivoMeta,
} from "./conexiones.server";
import { crearClienteServidor } from "./rutina.server";

/**
 * Token de usuario de sistema de Meta (permanente), configurado como secreto del
 * servidor. Nunca se expone al navegador: solo se usa dentro de funciones de
 * servidor para leer activos y publicar en los feeds de cada empresa.
 */
export function tokenSistemaMeta(): string | null {
  const t = process.env["META_SYSTEM_USER_TOKEN"];
  return t && t.trim() ? t.trim() : null;
}

export function haySistemaMeta(): boolean {
  return Boolean(tokenSistemaMeta());
}

type Respuesta = {
  data?: { id: string; name: string; instagram_business_account?: { id: string; username?: string } }[];
  error?: { message?: string };
};

/** Páginas de Facebook (y cuentas de Instagram vinculadas) accesibles con el token de sistema. */
export async function activosSistemaMeta(empresaId: string) {
  const token = tokenSistemaMeta();
  if (!token) {
    const detalle =
      "No hay un token de usuario de sistema de Meta configurado en el servidor (META_SYSTEM_USER_TOKEN).";
    return { ok: false, detalle, paginas: [] as ActivoMeta[] };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=100&access_token=${token}`,
    );
    const cuerpo = (await res.json()) as Respuesta;
    if (!res.ok) throw new Error(cuerpo.error?.message ?? `Error HTTP ${res.status}`);
    const paginas: ActivoMeta[] = (cuerpo.data ?? []).map((p) => ({
      paginaId: p.id,
      paginaNombre: p.name,
      instagramId: p.instagram_business_account?.id ?? "",
      instagramUsuario: p.instagram_business_account?.username ?? "",
    }));
    const detalle = paginas.length
      ? `El token de sistema administra ${paginas.length} página(s) de Facebook y ${paginas.filter((p) => p.instagramId).length} cuenta(s) de Instagram profesional.`
      : "El token de sistema no administra ninguna página de Facebook.";
    await registrarEventoProveedor(
      empresaId,
      "meta",
      paginas.length ? "sistema_activos_ok" : "sistema_activos_error",
      detalle,
    );
    return { ok: paginas.length > 0, detalle, paginas };
  } catch (e) {
    const detalle = `No se pudieron leer los activos con el token de sistema: ${(e as Error).message}`;
    await registrarEventoProveedor(empresaId, "meta", "sistema_activos_error", detalle);
    return { ok: false, detalle, paginas: [] as ActivoMeta[] };
  }
}

/**
 * Vincula una página/cuenta a la empresa usando el token de sistema y guarda el
 * token de publicación cifrado. Para Facebook se guarda el token de la página;
 * para Instagram se guarda el token de sistema, que es el que acepta la
 * Content Publishing API con el ID de la cuenta profesional.
 */
export async function conectarConTokenSistema(
  empresaId: string,
  red: "facebook" | "instagram",
  paginaId: string,
) {
  const sistema = tokenSistemaMeta();
  if (!sistema) {
    throw new Error(
      "Falta el token de usuario de sistema de Meta en el servidor. Guárdalo como secreto y vuelve a intentarlo.",
    );
  }
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${paginaId}?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${sistema}`,
  );
  const cuerpo = (await res.json()) as {
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id: string; username?: string };
    error?: { message?: string };
  };
  if (!res.ok || !cuerpo.id) {
    const mensaje = cuerpo.error?.message ?? `Error HTTP ${res.status}`;
    await registrarEventoProveedor(empresaId, "meta", "sistema_conexion_error", mensaje);
    throw new Error(`Meta rechazó la página indicada: ${mensaje}`);
  }

  let cuentaId = cuerpo.id;
  let cuentaNombre = cuerpo.name ?? paginaId;
  let token = cuerpo.access_token ?? sistema;

  if (red === "instagram") {
    const ig = cuerpo.instagram_business_account;
    if (!ig?.id) {
      throw new Error(
        "La página seleccionada no tiene una cuenta profesional de Instagram vinculada en Meta Business.",
      );
    }
    cuentaId = ig.id;
    cuentaNombre = ig.username ? `@${ig.username}` : ig.id;
    token = sistema;
  }

  const resultado = await guardarResultado({
    empresaId,
    red,
    // El token de usuario de sistema no pasa por el diálogo de consentimiento:
    // los permisos se conceden en Meta Business al asignar los activos.
    otorgados: PERMISOS_REQUERIDOS[red],
    cuentaId,
    cuentaNombre,
    accessToken: token,
    detalleExtra: "Conexión establecida con el token de usuario de sistema de Meta.",
  });
  await registrarEventoProveedor(
    empresaId,
    "meta",
    "sistema_conexion_ok",
    `${red === "facebook" ? "Facebook" : "Instagram"} conectado con token de sistema: ${cuentaNombre} (${cuentaId}).`,
  );
  return { ...resultado, cuentaId, cuentaNombre };
}

/**
 * Token con el que se publica en una red: primero el guardado por empresa
 * (OAuth o token de sistema ya vinculado) y, si no existe, el token de sistema.
 */
export async function tokenPublicacion(
  empresaId: string,
  red: "facebook" | "instagram",
): Promise<string | null> {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("conexiones_tokens")
    .select("access_token_cifrado")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();
  if (data?.access_token_cifrado) return descifrar(data.access_token_cifrado);
  return tokenSistemaMeta();
}

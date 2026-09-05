import { crearClienteServidor } from "./rutina.server";
import { cifrar, descifrar, pistaDe } from "./cripto.server";

export type Red = "facebook" | "instagram" | "tiktok";
export type Proveedor = "meta" | "tiktok";

export const PROVEEDOR_DE_RED: Record<Red, Proveedor> = {
  facebook: "meta",
  instagram: "meta",
  tiktok: "tiktok",
};

/** Permisos mínimos para considerar conectada una red para publicar contenido.
 *
 * `pages_read_engagement` se solicita/usa para analíticas avanzadas, pero Meta
 * puede exigir revisión adicional antes de habilitarlo. No debe bloquear la
 * conexión operativa de publicación.
 */
export const PERMISOS_REQUERIDOS: Record<Red, string[]> = {
  facebook: ["pages_show_list", "pages_manage_posts"],
  instagram: ["instagram_basic", "instagram_content_publish"],
  tiktok: ["video.upload", "video.publish"],
};

export const SCOPES_SOLICITADOS: Record<Red, string[]> = {
  facebook: ["pages_show_list", "pages_manage_posts", "pages_messaging", "pages_manage_metadata"],
  instagram: [
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_messages",
  ],
  tiktok: ["user.info.basic", "video.upload", "video.publish"],
};

type Credencial = { clientId: string; clientSecret: string };

export async function leerCredencial(
  empresaId: string,
  proveedor: Proveedor,
): Promise<Credencial | null> {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("app_credenciales")
    .select("client_id, client_secret_cifrado")
    .eq("empresa_id", empresaId)
    .eq("proveedor", proveedor)
    .maybeSingle();
  if (data) {
    return { clientId: data.client_id, clientSecret: descifrar(data.client_secret_cifrado) };
  }
  // Respaldo: credenciales globales del servidor si aún no se registraron por empresa.
  const id = proveedor === "meta" ? process.env["META_APP_ID"] : process.env["TIKTOK_CLIENT_KEY"];
  const secreto =
    proveedor === "meta" ? process.env["META_APP_SECRET"] : process.env["TIKTOK_CLIENT_SECRET"];
  return id && secreto ? { clientId: id, clientSecret: secreto } : null;
}

export async function guardarCredencial(
  empresaId: string,
  proveedor: Proveedor,
  clientId: string,
  clientSecret: string,
  userId: string,
) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from("app_credenciales").upsert(
    {
      empresa_id: empresaId,
      proveedor,
      client_id: clientId,
      client_secret_cifrado: cifrar(clientSecret),
      pista_secreto: pistaDe(clientSecret),
      actualizado_por: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,proveedor" },
  );
  if (error) throw new Error(error.message);
}

export async function resumenCredenciales(empresaId: string) {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("app_credenciales")
    .select("proveedor, client_id, pista_secreto, updated_at, verificada_at, verificacion_detalle")
    .eq("empresa_id", empresaId);
  const de = (proveedor: Proveedor) => {
    const fila = (data ?? []).find((f) => f.proveedor === proveedor);
    if (fila) {
      return {
        registrada: true,
        origen: "empresa" as const,
        clientId: fila.client_id,
        pista: fila.pista_secreto,
        actualizado: fila.updated_at,
        verificada: Boolean(fila.verificada_at),
        verificadaAt: fila.verificada_at as string | null,
        detalleVerificacion: fila.verificacion_detalle ?? "",
      };
    }
    const global =
      proveedor === "meta"
        ? Boolean(process.env["META_APP_ID"] && process.env["META_APP_SECRET"])
        : Boolean(process.env["TIKTOK_CLIENT_KEY"] && process.env["TIKTOK_CLIENT_SECRET"]);
    return {
      registrada: global,
      origen: "servidor" as const,
      clientId: "",
      pista: "",
      actualizado: null as string | null,
      verificada: false,
      verificadaAt: null as string | null,
      detalleVerificacion: "",
    };
  };
  return { meta: de("meta"), tiktok: de("tiktok") };
}

/**
 * Comprueba contra la plataforma que el par ID/secreto sea válido pidiendo un token de app.
 * No publica nada ni pide permisos de usuario: solo confirma que la app existe y el secreto coincide.
 */
export async function verificarCredencial(empresaId: string, proveedor: Proveedor) {
  const cred = await leerCredencial(empresaId, proveedor);
  if (!cred) {
    return {
      ok: false,
      detalle:
        proveedor === "meta"
          ? "Aún no hay App ID ni App Secret de Meta guardados para esta empresa."
          : "Aún no hay Client Key ni Client Secret de TikTok guardados para esta empresa.",
    };
  }

  let ok = false;
  let detalle = "";
  try {
    if (proveedor === "meta") {
      const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      url.searchParams.set("client_id", cred.clientId);
      url.searchParams.set("client_secret", cred.clientSecret);
      url.searchParams.set("grant_type", "client_credentials");
      const res = await fetch(url, { method: "GET" });
      const cuerpo = (await res.json()) as {
        access_token?: string;
        error?: { message?: string; code?: number };
      };
      ok = res.ok && Boolean(cuerpo.access_token);
      detalle = ok
        ? "Meta validó el App ID y el App Secret: la app responde y emitió un token de aplicación."
        : `Meta rechazó las credenciales: ${cuerpo.error?.message ?? `error HTTP ${res.status}`}.`;
    } else {
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: cred.clientId,
          client_secret: cred.clientSecret,
          grant_type: "client_credentials",
        }),
      });
      const cuerpo = (await res.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };
      ok = res.ok && Boolean(cuerpo.access_token);
      detalle = ok
        ? "TikTok validó el Client Key y el Client Secret: la app responde y emitió un token de aplicación."
        : `TikTok rechazó las credenciales: ${cuerpo.error_description ?? cuerpo.error ?? `error HTTP ${res.status}`}.`;
    }
  } catch (e) {
    ok = false;
    detalle = `No se pudo contactar a la plataforma: ${(e as Error).message}`;
  }

  const supabase = crearClienteServidor();
  await supabase
    .from("app_credenciales")
    .update({
      verificada_at: ok ? new Date().toISOString() : null,
      verificacion_detalle: detalle,
    })
    .eq("empresa_id", empresaId)
    .eq("proveedor", proveedor);

  await registrarEventoProveedor(
    empresaId,
    proveedor,
    ok ? "verificacion_ok" : "verificacion_error",
    detalle,
  );
  return { ok, detalle };
}

/** Bitácora de intentos de verificación y sincronización de la app por proveedor. */
export async function historialVerificacion(empresaId: string, proveedor: Proveedor) {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("conexiones_eventos")
    .select("id, estado, mensaje, created_at")
    .eq("empresa_id", empresaId)
    .eq("red", proveedor)
    .neq("estado", "activos_firma")
    .order("created_at", { ascending: false })
    .limit(15);
  return (data ?? []).map((f) => ({
    id: f.id,
    estado: f.estado,
    mensaje: f.mensaje,
    fecha: f.created_at,
  }));
}

/**
 * Lee las páginas de Facebook y las cuentas de Instagram profesionales que la
 * autorización vigente de la empresa puede administrar. No publica nada.
 */
export async function activosMeta(empresaId: string) {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("conexiones_tokens")
    .select("red, access_token_cifrado, updated_at")
    .eq("empresa_id", empresaId)
    .in("red", ["facebook", "instagram"])
    .order("updated_at", { ascending: false });
  const fila = (data ?? [])[0];
  if (!fila) {
    const detalle =
      "Aún no hay una autorización de Meta vigente para esta empresa: autoriza Facebook o Instagram y vuelve a sincronizar.";
    await registrarEventoProveedor(empresaId, "meta", "sincronizacion_error", detalle);
    return { ok: false, detalle, paginas: [] as ActivoMeta[], cambio: false };
  }

  const token = descifrar(fila.access_token_cifrado);
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=100&access_token=${token}`,
    );
    const cuerpo = (await res.json()) as {
      data?: {
        id: string;
        name: string;
        instagram_business_account?: { id: string; username?: string };
      }[];
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(cuerpo.error?.message ?? `Error HTTP ${res.status}`);
    const paginas: ActivoMeta[] = (cuerpo.data ?? []).map((p) => ({
      paginaId: p.id,
      paginaNombre: p.name,
      instagramId: p.instagram_business_account?.id ?? "",
      instagramUsuario: p.instagram_business_account?.username ?? "",
    }));
    const detalle = paginas.length
      ? `Sincronización correcta: ${paginas.length} página(s) de Facebook y ${
          paginas.filter((p) => p.instagramId).length
        } cuenta(s) de Instagram profesional disponibles.`
      : "La autorización vigente no administra ninguna página de Facebook.";
    await registrarEventoProveedor(
      empresaId,
      "meta",
      paginas.length ? "sincronizacion_ok" : "sincronizacion_error",
      detalle,
    );
    const cambio = await registrarCambioActivos(empresaId, paginas);
    return { ok: paginas.length > 0, detalle, paginas, cambio };
  } catch (e) {
    const detalle = `No se pudieron leer los activos de Meta: ${(e as Error).message}`;
    await registrarEventoProveedor(empresaId, "meta", "sincronizacion_error", detalle);
    return { ok: false, detalle, paginas: [] as ActivoMeta[], cambio: false };
  }
}

/** Compara el listado sincronizado con el anterior y deja constancia si cambió. */
async function registrarCambioActivos(empresaId: string, paginas: ActivoMeta[]) {
  const supabase = crearClienteServidor();
  const firma = JSON.stringify(
    paginas
      .map((p) => `${p.paginaId}:${p.paginaNombre}|${p.instagramId}:${p.instagramUsuario}`)
      .sort(),
  );
  const { data } = await supabase
    .from("conexiones_eventos")
    .select("mensaje")
    .eq("empresa_id", empresaId)
    .eq("red", "meta")
    .eq("estado", "activos_firma")
    .order("created_at", { ascending: false })
    .limit(1);
  const anterior = (data ?? [])[0]?.mensaje ?? "";
  const cambio = anterior !== "" && anterior !== firma;
  if (anterior !== firma) {
    await supabase
      .from("conexiones_eventos")
      .insert({ empresa_id: empresaId, red: "meta", estado: "activos_firma", mensaje: firma });
    if (cambio) {
      await registrarEventoProveedor(
        empresaId,
        "meta",
        "activos_cambiaron",
        `El listado de activos cambió: ahora hay ${paginas.length} página(s) de Facebook y ${
          paginas.filter((p) => p.instagramId).length
        } cuenta(s) de Instagram profesional.`,
      );
    }
  }
  return cambio;
}

/**
 * Autoriza (o reintenta) un activo concreto: vincula la página o cuenta a la empresa y
 * confirma contra Meta que los permisos de publicación estén realmente aprobados.
 */
export async function autorizarActivoMeta(
  empresaId: string,
  red: Exclude<Red, "tiktok">,
  cuentaId: string,
  cuentaNombre: string,
) {
  const supabase = crearClienteServidor();
  const { data: tokens } = await supabase
    .from("conexiones_tokens")
    .select("access_token_cifrado, updated_at")
    .eq("empresa_id", empresaId)
    .in("red", ["facebook", "instagram"])
    .order("updated_at", { ascending: false });
  const filaToken = (tokens ?? [])[0];
  if (!filaToken) {
    const detalle =
      "No hay una autorización de Meta vigente: vuelve a autorizar Facebook o Instagram antes de habilitar el activo.";
    await registrarEventoProveedor(empresaId, "meta", "autorizacion_activo_error", detalle);
    return {
      estado: "error" as const,
      detalle,
      otorgados: [] as string[],
      faltantes: PERMISOS_REQUERIDOS[red],
    };
  }
  const token = descifrar(filaToken.access_token_cifrado);
  const requeridos = PERMISOS_REQUERIDOS[red];

  let otorgados: string[] = [];
  let estado: "aprobado" | "pendiente" | "error" = "error";
  let detalle = "";
  try {
    const permisosRes = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`,
    );
    const permisosJson = (await permisosRes.json()) as {
      data?: { permission: string; status: string }[];
      error?: { message?: string };
    };
    if (!permisosRes.ok)
      throw new Error(permisosJson.error?.message ?? `Error HTTP ${permisosRes.status}`);
    otorgados = (permisosJson.data ?? [])
      .filter((p) => p.status === "granted")
      .map((p) => p.permission);

    const url =
      red === "facebook"
        ? `https://graph.facebook.com/v21.0/${cuentaId}?fields=id,name,tasks&access_token=${token}`
        : `https://graph.facebook.com/v21.0/${cuentaId}?fields=id,username&access_token=${token}`;
    const activoRes = await fetch(url);
    const activoJson = (await activoRes.json()) as {
      id?: string;
      name?: string;
      username?: string;
      tasks?: string[];
      error?: { message?: string };
    };
    if (!activoRes.ok || !activoJson.id) {
      throw new Error(activoJson.error?.message ?? `Error HTTP ${activoRes.status}`);
    }

    const faltantesPermisos = requeridos.filter((p) => !otorgados.includes(p));
    const tareas = activoJson.tasks ?? [];
    const sinTareaPublicar =
      red === "facebook" && tareas.length > 0 && !tareas.includes("CREATE_CONTENT");

    if (faltantesPermisos.length === 0 && !sinTareaPublicar) {
      estado = "aprobado";
      detalle = `Activo aprobado para publicar: ${cuentaNombre || activoJson.name || activoJson.username || cuentaId}. Permisos concedidos (${requeridos.join(", ")}).`;
    } else {
      estado = "pendiente";
      detalle = [
        `Activo vinculado: ${cuentaNombre || activoJson.name || activoJson.username || cuentaId}.`,
        faltantesPermisos.length ? `Permisos pendientes: ${faltantesPermisos.join(", ")}.` : "",
        sinTareaPublicar
          ? "La cuenta que autorizó no tiene la tarea CREATE_CONTENT sobre esta página."
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    }
  } catch (e) {
    estado = "error";
    detalle = `Meta rechazó la autorización del activo (${cuentaNombre || cuentaId}): ${(e as Error).message}`;
  }

  const faltantes = requeridos.filter((p) => !otorgados.includes(p));
  const conectada = estado === "aprobado";

  if (estado !== "error") {
    await supabase.from("conexiones_redes").upsert(
      {
        empresa_id: empresaId,
        red,
        proveedor: "meta",
        estado: conectada ? "conectada" : "autorizada",
        cuenta_externa_id: cuentaId,
        cuenta_externa_nombre: cuentaNombre,
        permisos_otorgados: otorgados,
        permisos_faltantes: faltantes,
        detalle,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "empresa_id,red" },
    );
    await supabase
      .from("cuentas_sociales")
      .update({
        conectada,
        ...(cuentaNombre ? { usuario: cuentaNombre } : {}),
        notas: detalle,
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .eq("red", red);
  }

  await registrarEvento(
    empresaId,
    red,
    estado === "aprobado" ? "conectada" : estado === "pendiente" ? "autorizada" : "error",
    detalle,
  );
  await registrarEventoProveedor(
    empresaId,
    "meta",
    estado === "aprobado"
      ? "autorizacion_activo_ok"
      : estado === "pendiente"
        ? "autorizacion_activo_pendiente"
        : "autorizacion_activo_error",
    `${red === "facebook" ? "Facebook" : "Instagram"} · ${detalle}`,
  );

  return { estado, detalle, otorgados, faltantes };
}

export type ActivoMeta = {
  paginaId: string;
  paginaNombre: string;
  instagramId: string;
  instagramUsuario: string;
};

/** Asigna a la empresa la página o la cuenta de Instagram elegida entre las sincronizadas. */
export async function elegirActivoMeta(
  empresaId: string,
  red: Exclude<Red, "tiktok">,
  cuentaId: string,
  cuentaNombre: string,
) {
  const supabase = crearClienteServidor();
  const { data: fila } = await supabase
    .from("conexiones_redes")
    .select("permisos_otorgados")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();
  const otorgados = (fila?.permisos_otorgados ?? []) as string[];
  const faltantes = PERMISOS_REQUERIDOS[red].filter((p) => !otorgados.includes(p));
  const conectada = faltantes.length === 0 && Boolean(cuentaId);
  const detalle = conectada
    ? `Cuenta vinculada: ${cuentaNombre || cuentaId}. Permisos aprobados (${PERMISOS_REQUERIDOS[red].join(", ")}).`
    : `Cuenta vinculada: ${cuentaNombre || cuentaId}. Permisos pendientes: ${faltantes.join(", ")}.`;

  await supabase.from("conexiones_redes").upsert(
    {
      empresa_id: empresaId,
      red,
      proveedor: "meta",
      estado: conectada ? "conectada" : "autorizada",
      cuenta_externa_id: cuentaId,
      cuenta_externa_nombre: cuentaNombre,
      permisos_otorgados: otorgados,
      permisos_faltantes: faltantes,
      detalle,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,red" },
  );

  await supabase
    .from("cuentas_sociales")
    .update({
      conectada,
      ...(cuentaNombre ? { usuario: cuentaNombre } : {}),
      notas: detalle,
      updated_at: new Date().toISOString(),
    })
    .eq("empresa_id", empresaId)
    .eq("red", red);

  await registrarEvento(empresaId, red, conectada ? "conectada" : "autorizada", detalle);
  return { conectada, faltantes, detalle };
}

export async function registrarEvento(
  empresaId: string,
  red: Red,
  estado: string,
  mensaje: string,
) {
  const supabase = crearClienteServidor();
  await supabase.from("conexiones_eventos").insert({
    empresa_id: empresaId,
    red,
    estado,
    mensaje,
  });
}

/** Registra el evento a nivel de app (proveedor) y no de una red concreta. */
export async function registrarEventoProveedor(
  empresaId: string,
  proveedor: Proveedor,
  estado: string,
  mensaje: string,
) {
  const supabase = crearClienteServidor();
  await supabase.from("conexiones_eventos").insert({
    empresa_id: empresaId,
    red: proveedor,
    estado,
    mensaje,
  });
}

export async function guardarResultado(opciones: {
  empresaId: string;
  red: Red;
  otorgados: string[];
  cuentaId: string;
  cuentaNombre: string;
  accessToken: string;
  refreshToken?: string | null;
  expiraEn?: number | null;
  detalleExtra?: string;
}) {
  const supabase = crearClienteServidor();
  const requeridos = PERMISOS_REQUERIDOS[opciones.red];
  const faltantes = requeridos.filter((p) => !opciones.otorgados.includes(p));
  const sinCuenta = !opciones.cuentaId;
  const conectada = faltantes.length === 0 && !sinCuenta;
  const estado = conectada ? "conectada" : "autorizada";
  const detalle = conectada
    ? `Autorización completa: permisos aprobados (${requeridos.join(", ")}).`
    : [
        faltantes.length ? `Permisos pendientes: ${faltantes.join(", ")}.` : "",
        sinCuenta ? "Falta vincular la cuenta o página oficial de la empresa." : "",
        opciones.detalleExtra ?? "",
      ]
        .filter(Boolean)
        .join(" ");
  const expira = opciones.expiraEn
    ? new Date(Date.now() + opciones.expiraEn * 1000).toISOString()
    : null;

  const { error } = await supabase.from("conexiones_redes").upsert(
    {
      empresa_id: opciones.empresaId,
      red: opciones.red,
      proveedor: PROVEEDOR_DE_RED[opciones.red],
      estado,
      cuenta_externa_id: opciones.cuentaId,
      cuenta_externa_nombre: opciones.cuentaNombre,
      permisos_otorgados: opciones.otorgados,
      permisos_faltantes: faltantes,
      detalle,
      autorizada_at: new Date().toISOString(),
      expira_at: expira,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,red" },
  );
  if (error) throw new Error(error.message);

  await supabase.from("conexiones_tokens").upsert(
    {
      empresa_id: opciones.empresaId,
      red: opciones.red,
      access_token_cifrado: cifrar(opciones.accessToken),
      refresh_token_cifrado: opciones.refreshToken ? cifrar(opciones.refreshToken) : null,
      expira_at: expira,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,red" },
  );

  // La tarjeta de cuentas sociales solo se marca conectada con permisos aprobados.
  await supabase
    .from("cuentas_sociales")
    .update({ conectada, notas: detalle, updated_at: new Date().toISOString() })
    .eq("empresa_id", opciones.empresaId)
    .eq("red", opciones.red);

  await registrarEvento(opciones.empresaId, opciones.red, estado, detalle);
  return { estado, conectada, faltantes };
}

export async function guardarError(empresaId: string, red: Red, mensaje: string) {
  const supabase = crearClienteServidor();
  await supabase.from("conexiones_redes").upsert(
    {
      empresa_id: empresaId,
      red,
      proveedor: PROVEEDOR_DE_RED[red],
      estado: "error",
      detalle: mensaje,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "empresa_id,red" },
  );
  await registrarEvento(empresaId, red, "error", mensaje);
}

/** Intercambia el código de Meta por un token de larga duración y lee permisos y cuentas. */
export async function completarMeta(
  empresaId: string,
  red: Red,
  code: string,
  redirectUri: string,
) {
  const cred = await leerCredencial(empresaId, "meta");
  if (!cred) throw new Error("No hay credenciales de la app de Meta registradas para la empresa.");

  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", cred.clientId);
  tokenUrl.searchParams.set("client_secret", cred.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);
  const tokenRes = await fetch(tokenUrl);
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error?.message ?? "Meta rechazó el intercambio del código.");
  }

  const largoUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  largoUrl.searchParams.set("grant_type", "fb_exchange_token");
  largoUrl.searchParams.set("client_id", cred.clientId);
  largoUrl.searchParams.set("client_secret", cred.clientSecret);
  largoUrl.searchParams.set("fb_exchange_token", tokenJson.access_token);
  const largoJson = (await (await fetch(largoUrl)).json()) as {
    access_token?: string;
    expires_in?: number;
  };
  const token = largoJson.access_token ?? tokenJson.access_token;
  const expiraEn = largoJson.expires_in ?? tokenJson.expires_in ?? null;

  const permisosJson = (await (
    await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`)
  ).json()) as { data?: { permission: string; status: string }[] };
  const otorgados = (permisosJson.data ?? [])
    .filter((p) => p.status === "granted")
    .map((p) => p.permission);

  const paginasJson = (await (
    await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${token}`,
    )
  ).json()) as {
    data?: {
      id: string;
      name: string;
      instagram_business_account?: { id: string; username?: string };
    }[];
  };
  const paginas = paginasJson.data ?? [];

  // Nunca se toma la primera página disponible: se busca la que corresponde al
  // identificador registrado de la empresa. Si hay varias y ninguna coincide,
  // se deja sin activo para que un administrador apruebe la correcta.
  const normalizar = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const supabaseEmpresa = crearClienteServidor();
  const [{ data: cuentaFila }, { data: empresaFila }] = await Promise.all([
    supabaseEmpresa
      .from("cuentas_sociales")
      .select("usuario")
      .eq("empresa_id", empresaId)
      .eq("red", red)
      .limit(1)
      .maybeSingle(),
    supabaseEmpresa.from("empresas").select("nombre").eq("id", empresaId).limit(1).maybeSingle(),
  ]);
  const esperados = [cuentaFila?.usuario ?? "", empresaFila?.nombre ?? ""]
    .map(normalizar)
    .filter((v) => v.length >= 4);
  const coincide = (etiquetas: string[]) =>
    etiquetas.some((etiqueta) => {
      const e = normalizar(etiqueta);
      return e.length >= 4 && esperados.some((x) => e.includes(x) || x.includes(e));
    });

  const candidatas =
    red === "facebook"
      ? paginas.filter((p) => coincide([p.name]))
      : paginas.filter((p) =>
          coincide([p.instagram_business_account?.username ?? "", p.name]),
        );
  const conIg = paginas.filter((p) => p.instagram_business_account?.id);
  const universo = red === "facebook" ? paginas : conIg;
  const pagina = candidatas[0] ?? (universo.length === 1 ? universo[0] : undefined);

  let cuentaId = "";
  let cuentaNombre = "";
  let detalleExtra = "";
  if (red === "facebook") {
    cuentaId = pagina?.id ?? "";
    cuentaNombre = pagina?.name ?? "";
    if (!cuentaId) {
      detalleExtra = paginas.length
        ? `No se identificó automáticamente la página de la empresa entre ${paginas.length} disponible(s) (${paginas
            .map((p) => p.name)
            .join(", ")}). Aprueba la página correcta en «Activos de Meta».`
        : "La cuenta autorizada no administra ninguna página de Facebook.";
    }
  } else {
    cuentaId = pagina?.instagram_business_account?.id ?? "";
    cuentaNombre = pagina?.instagram_business_account?.username ?? "";
    if (!cuentaId) {
      detalleExtra = conIg.length
        ? `No se identificó automáticamente la cuenta de Instagram de la empresa entre ${conIg.length} disponible(s). Aprueba la cuenta correcta en «Activos de Meta».`
        : "No se encontró una cuenta de Instagram profesional vinculada a la página de Facebook.";
    }
  }


  return guardarResultado({
    empresaId,
    red,
    otorgados,
    cuentaId,
    cuentaNombre,
    accessToken: token!,
    expiraEn,
    detalleExtra,
  });
}

/** Intercambia el código de TikTok y deja constancia del acceso a Content Posting API. */
export async function completarTikTok(empresaId: string, code: string, redirectUri: string) {
  const cred = await leerCredencial(empresaId, "tiktok");
  if (!cred)
    throw new Error("No hay credenciales de la app de TikTok registradas para la empresa.");

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: cred.clientId,
      client_secret: cred.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
    scope?: string;
    error_description?: string;
    error?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description ?? json.error ?? "TikTok rechazó el intercambio.");
  }
  const otorgados = (json.scope ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let cuentaNombre = "";
  try {
    const perfil = (await (
      await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,username", {
        headers: { Authorization: `Bearer ${json.access_token}` },
      })
    ).json()) as { data?: { user?: { display_name?: string; username?: string } } };
    cuentaNombre = perfil.data?.user?.username ?? perfil.data?.user?.display_name ?? "";
  } catch {
    cuentaNombre = "";
  }

  return guardarResultado({
    empresaId,
    red: "tiktok",
    otorgados,
    cuentaId: json.open_id ?? "",
    cuentaNombre,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiraEn: json.expires_in ?? null,
    detalleExtra:
      "Requiere cuenta TikTok Business y aprobación de Content Posting API (video.upload y video.publish).",
  });
}

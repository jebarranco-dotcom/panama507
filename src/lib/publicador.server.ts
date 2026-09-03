import { PERMISOS_REQUERIDOS, registrarEvento, type Red } from "./conexiones.server";
import { descifrar } from "./cripto.server";
import { registrarLog, registrarResultadoRed, reservarEjecucion } from "./logs.server";
import { crearClienteServidor } from "./rutina.server";

/** Panamá opera todo el año en UTC-5, sin horario de verano. */
export const OFFSET_PANAMA_HORAS = -5;

/** Fecha (YYYY-MM-DD) y hora (HH:MM) actuales en hora de Panamá. */
export function ahoraPanama(base = new Date()) {
  const local = new Date(base.getTime() + OFFSET_PANAMA_HORAS * 3600 * 1000);
  return { fecha: local.toISOString().slice(0, 10), hora: local.toISOString().slice(11, 16) };
}

/** Publica un texto en la página de Facebook de la empresa. */
export async function publicarEnFacebook(
  token: string,
  paginaId: string,
  mensaje: string,
  mediaUrl?: string,
) {
  if (!paginaId) throw new Error("La empresa no tiene una página de Facebook vinculada.");
  const ruta = mediaUrl ? "photos" : "feed";
  const cuerpoEnvio = mediaUrl
    ? { url: mediaUrl, caption: mensaje, access_token: token }
    : { message: mensaje, access_token: token };
  const respuesta = await fetch(`https://graph.facebook.com/v21.0/${paginaId}/${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpoEnvio),
  });
  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    id?: string;
    post_id?: string;
    error?: { message?: string };
  };
  const id = cuerpo.post_id ?? cuerpo.id;
  if (!respuesta.ok || !id) {
    throw new Error(cuerpo.error?.message ?? `Facebook respondió ${respuesta.status}.`);
  }
  return id;
}

/** Publica en Instagram: crea el contenedor de medios y luego lo publica. */
export async function publicarEnInstagram(
  token: string,
  cuentaId: string,
  mensaje: string,
  mediaUrl: string,
) {
  if (!cuentaId) throw new Error("La empresa no tiene una cuenta de Instagram vinculada.");
  if (!mediaUrl) {
    throw new Error(
      "Instagram exige una imagen o video con URL pública: agrega la imagen de la pieza antes de publicar.",
    );
  }
  const contenedorRes = await fetch(`https://graph.facebook.com/v21.0/${cuentaId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: mediaUrl, caption: mensaje, access_token: token }),
  });
  const contenedor = (await contenedorRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!contenedorRes.ok || !contenedor.id) {
    throw new Error(contenedor.error?.message ?? `Instagram respondió ${contenedorRes.status}.`);
  }
  const publicarRes = await fetch(`https://graph.facebook.com/v21.0/${cuentaId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: contenedor.id, access_token: token }),
  });
  const publicado = (await publicarRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!publicarRes.ok || !publicado.id) {
    throw new Error(publicado.error?.message ?? `Instagram respondió ${publicarRes.status}.`);
  }
  return publicado.id;
}

type Pieza = {
  id: string;
  red: string;
  titular: string;
  copy: string;
  hashtags: string[] | null;
  cta: string | null;
  media_url: string | null;
  intentos_publicacion: number | null;
};

export function textoDePieza(p: {
  titular: string;
  copy: string;
  hashtags?: string[] | null;
  cta?: string | null;
}) {
  return [p.titular, p.copy, p.cta ?? "", (p.hashtags ?? []).join(" ")]
    .filter((x) => x && x.trim())
    .join("\n\n");
}

/** Envía una pieza concreta a su red. Devuelve el resultado sin lanzar excepciones. */
export async function enviarPieza(empresaId: string, publicacionId: string) {
  const supabase = crearClienteServidor();
  const { data: pieza } = await supabase
    .from("publicaciones")
    .select("id, red, titular, copy, hashtags, cta, media_url, intentos_publicacion")
    .eq("empresa_id", empresaId)
    .eq("id", publicacionId)
    .maybeSingle();
  if (!pieza) return { ok: false, estado: "error", detalle: "La publicación no existe." };
  return enviar(empresaId, pieza as Pieza);
}

async function enviar(empresaId: string, pieza: Pieza) {
  const supabase = crearClienteServidor();
  const red = pieza.red as Red;
  const intentos = (pieza.intentos_publicacion ?? 0) + 1;

  const { data: conexion } = await supabase
    .from("conexiones_redes")
    .select("estado, cuenta_externa_id, cuenta_externa_nombre, permisos_otorgados")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();
  const otorgados = (conexion?.permisos_otorgados ?? []) as string[];
  const faltantes = (PERMISOS_REQUERIDOS[red] ?? []).filter((p) => !otorgados.includes(p));
  const lista = conexion?.estado === "conectada" && faltantes.length === 0;

  const marcar = async (campos: Record<string, unknown>) => {
    await supabase
      .from("publicaciones")
      .update({ ...campos, intentos_publicacion: intentos })
      .eq("id", pieza.id);
  };

  if (!lista || red === "tiktok") {
    const detalle =
      red === "tiktok"
        ? "TikTok requiere video mediante la Content Posting API aprobada: la pieza queda en la cola interna."
        : faltantes.length
          ? `${red} no está conectada de forma oficial. Permisos pendientes: ${faltantes.join(", ")}.`
          : `${red} aún no tiene una autorización válida guardada.`;
    await marcar({ estado: "en_cola", error_publicacion: detalle });
    await registrarEvento(empresaId, red, "pendiente", `Publicación en cola: ${detalle}`);
    return { ok: false, estado: "en_cola", detalle };
  }

  const { data: fila } = await supabase
    .from("conexiones_tokens")
    .select("access_token_cifrado")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();
  if (!fila?.access_token_cifrado) {
    const detalle = `No hay token guardado para ${red}: vuelve a autorizar la red.`;
    await marcar({ estado: "en_cola", error_publicacion: detalle });
    return { ok: false, estado: "en_cola", detalle };
  }

  const token = descifrar(fila.access_token_cifrado);
  const mensaje = textoDePieza(pieza);
  try {
    const referencia =
      red === "facebook"
        ? await publicarEnFacebook(
            token,
            conexion?.cuenta_externa_id ?? "",
            mensaje,
            pieza.media_url ?? "",
          )
        : await publicarEnInstagram(
            token,
            conexion?.cuenta_externa_id ?? "",
            mensaje,
            pieza.media_url ?? "",
          );
    await marcar({
      estado: "publicado",
      publicado_at: new Date().toISOString(),
      referencia_externa: referencia,
      error_publicacion: "",
    });
    await registrarResultadoRed({
      empresaId,
      publicacionId: pieza.id,
      red,
      estado: "publicado",
      referenciaExterna: referencia,
      intentos: (pieza.intentos_publicacion ?? 0) + 1,
    });
    const detalle = `Publicado en ${conexion?.cuenta_externa_nombre || red} (ref. ${referencia}).`;
    await registrarEvento(empresaId, red, "conectada", detalle);
    return { ok: true, estado: "publicado", detalle, referencia };
  } catch (e) {
    const detalle = `${red} rechazó la publicación: ${(e as Error).message}`;
    await marcar({ estado: "error", error_publicacion: detalle });
    await registrarResultadoRed({
      empresaId,
      publicacionId: pieza.id,
      red,
      estado: "error",
      intentos: (pieza.intentos_publicacion ?? 0) + 1,
      errorDetalle: detalle,
    });
    await registrarEvento(empresaId, red, "error", detalle);
    return { ok: false, estado: "error", detalle };
  }
}

/**
 * Programador: envía las piezas aprobadas cuya hora de Panamá ya llegó.
 * Las empresas con aprobación obligatoria solo publican piezas ya aprobadas.
 */
export async function ejecutarProgramador(empresaId?: string) {
  const supabase = crearClienteServidor();
  const { fecha, hora } = ahoraPanama();

  const consulta = supabase
    .from("empresas")
    .select("id, nombre, requiere_aprobacion")
    .eq("activa", true);
  const { data: empresas } = empresaId ? await consulta.eq("id", empresaId) : await consulta;

  const resultados: {
    empresaId: string;
    nombre: string;
    publicadas: number;
    enCola: number;
    errores: number;
    esperandoAprobacion: number;
  }[] = [];

  for (const empresa of empresas ?? []) {
    const clave = `programador:${empresa.id}:${fecha}:${hora}`;
    if (!(await reservarEjecucion(clave, "programador", empresa.id))) continue;
    const inicio = Date.now();
    const { programacionDe } = await import("./programacion.server");
    const activas = new Set(
      (await programacionDe(empresa.id)).filter((f) => f.activo).map((f) => f.red as string),
    );

    const { data: piezas } = await supabase
      .from("publicaciones")
      .select(
        "id, red, titular, copy, hashtags, cta, media_url, intentos_publicacion, hora_programada, aprobada_at, estado",
      )
      .eq("empresa_id", empresa.id)
      // Las piezas en_cola vuelven a evaluarse cuando una conexión se autoriza
      // después de la generación. TikTok continúa en cola hasta implementar
      // el flujo de video aprobado por Content Posting API.
      .in("estado", ["programado", "borrador", "en_cola"])
      .lte("fecha_programada", fecha)
      .order("hora_programada");

    let publicadas = 0;
    let enCola = 0;
    let errores = 0;
    let esperando = 0;

    for (const pieza of piezas ?? []) {
      if (!activas.has(pieza.red)) continue;
      if (pieza.estado === "en_cola" && pieza.red === "tiktok") continue;
      if (pieza.hora_programada > hora) continue;
      const aprobada = Boolean(pieza.aprobada_at);
      if (empresa.requiere_aprobacion && !aprobada) {
        esperando++;
        continue;
      }
      if (pieza.estado === "borrador" && !aprobada) {
        esperando++;
        continue;
      }
      const r = await enviar(empresa.id, pieza as Pieza);
      if (r.estado === "publicado") publicadas++;
      else if (r.estado === "en_cola") enCola++;
      else errores++;
    }

    await registrarLog({
      empresaId: empresa.id,
      proceso: "programador",
      estado: errores > 0 ? "error" : "ok",
      detalle: `${publicadas} publicadas, ${enCola} en cola, ${errores} con error, ${esperando} esperando aprobación (${fecha} ${hora}).`,
      duracionMs: Date.now() - inicio,
    });

    resultados.push({
      empresaId: empresa.id,
      nombre: empresa.nombre,
      publicadas,
      enCola,
      errores,
      esperandoAprobacion: esperando,
    });
  }

  return { fecha, hora, empresas: resultados };
}

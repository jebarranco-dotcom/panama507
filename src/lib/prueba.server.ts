import { generateText } from "ai";

import {
  createLovableAiGatewayProvider,
  MODELO_TEXTO,
  requireGatewayKey,
} from "./ai-gateway.server";
import { crearClienteServidor } from "./rutina.server";
import { PERMISOS_REQUERIDOS, registrarEvento, type Red } from "./conexiones.server";
import { descifrar } from "./cripto.server";

export type ResultadoPrueba = {
  red: Red;
  empresa: string;
  modo: "real" | "simulada";
  ok: boolean;
  estado: string;
  titular: string;
  copy: string;
  detalle: string;
  referenciaExterna: string | null;
  publicacionId: string | null;
  ejecutadoAt: string;
};

/** Genera un texto corto de prueba con la voz de la empresa. */
async function redactarPrueba(empresa: {
  nombre: string;
  giro: string | null;
  zonas: string | null;
  tono: string | null;
  whatsapp: string | null;
}, red: Red) {
  const gateway = createLovableAiGatewayProvider(requireGatewayKey());
  const { text } = await generateText({
    model: gateway(MODELO_TEXTO),
    system: `Eres el community manager de ${empresa.nombre} (${empresa.giro ?? "servicios"}), zonas: ${
      empresa.zonas ?? "Panamá"
    }. Tono ${empresa.tono ?? "cercano y profesional"}. Español, sin markdown, máximo 2 emojis.`,
    prompt: `Escribe una publicación BREVE de PRUEBA técnica para ${red}. Debe decir de forma natural que es una prueba de conexión del canal oficial e invitar a escribir por mensaje${
      empresa.whatsapp ? ` o WhatsApp ${empresa.whatsapp}` : ""
    }.
Formato de respuesta exacto:
Línea 1: titular de máximo 60 caracteres.
Línea 2 en adelante: copy de máximo 280 caracteres.`,
  });
  const lineas = text.trim().split("\n").filter((l) => l.trim());
  const titular = (lineas[0] ?? `Prueba de canal ${red}`).replace(/^["']|["']$/g, "").slice(0, 110);
  const copy = lineas.slice(1).join("\n").trim() || `Publicación de prueba del canal oficial de ${empresa.nombre}.`;
  return { titular, copy };
}

/** Publica en la página de Facebook cuando la conexión está aprobada. */
async function publicarEnFacebook(token: string, cuentaId: string, mensaje: string) {
  const url = new URL(`https://graph.facebook.com/v21.0/${cuentaId}/feed`);
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: mensaje, access_token: token }),
  });
  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!respuesta.ok || !cuerpo.id) {
    throw new Error(cuerpo.error?.message ?? `Facebook respondió ${respuesta.status}.`);
  }
  return cuerpo.id;
}

/**
 * Ejecuta una publicación de prueba por empresa y red.
 * Si la red está conectada con permisos aprobados intenta el envío real;
 * en caso contrario deja el registro interno explicando qué falta.
 */
export async function publicarPrueba(empresaId: string, red: Red): Promise<ResultadoPrueba> {
  const supabase = crearClienteServidor();
  const ejecutadoAt = new Date().toISOString();

  const { data: empresa, error: errEmpresa } = await supabase
    .from("empresas")
    .select("id, nombre, giro, zonas, tono, whatsapp")
    .eq("id", empresaId)
    .maybeSingle();
  if (errEmpresa || !empresa) throw new Error("Empresa no encontrada.");

  const { data: conexion } = await supabase
    .from("conexiones_redes")
    .select("estado, cuenta_externa_id, cuenta_externa_nombre, permisos_otorgados, permisos_faltantes")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();

  const { titular, copy } = await redactarPrueba(empresa, red);
  const mensaje = `${titular}\n\n${copy}`;

  const requeridos = PERMISOS_REQUERIDOS[red];
  const otorgados = conexion?.permisos_otorgados ?? [];
  const faltantes = requeridos.filter((p) => !otorgados.includes(p));
  const conectada = conexion?.estado === "conectada" && faltantes.length === 0;

  let modo: ResultadoPrueba["modo"] = "simulada";
  let ok = false;
  let detalle = "";
  let referenciaExterna: string | null = null;

  if (!conectada) {
    detalle = faltantes.length
      ? `Prueba interna: ${red} aún no está conectada de forma oficial. Permisos pendientes: ${faltantes.join(", ")}.`
      : `Prueba interna: ${red} aún no tiene una autorización válida guardada.`;
  } else {
    const { data: fila } = await supabase
      .from("conexiones_tokens")
      .select("access_token_cifrado")
      .eq("empresa_id", empresaId)
      .eq("red", red)
      .maybeSingle();
    if (!fila?.access_token_cifrado) {
      detalle = `Prueba interna: no hay token guardado para ${red}; vuelve a autorizar la red.`;
    } else if (red === "facebook") {
      try {
        referenciaExterna = await publicarEnFacebook(
          descifrar(fila.access_token_cifrado),
          conexion?.cuenta_externa_id ?? "",
          mensaje,
        );
        modo = "real";
        ok = true;
        detalle = `Publicación real enviada a ${conexion?.cuenta_externa_nombre ?? "la página oficial"}.`;
      } catch (e) {
        modo = "real";
        detalle = `Facebook rechazó la prueba: ${(e as Error).message}`;
      }
    } else {
      detalle =
        red === "instagram"
          ? "Instagram exige un archivo de imagen o video alojado públicamente; la prueba quedó registrada sin envío de medios."
          : "TikTok solo acepta publicaciones con video mediante la Content Posting API aprobada; la prueba quedó registrada sin envío de medios.";
    }
  }

  const estado = ok ? "publicado" : conectada ? "error" : "en_cola";
  const { data: insertada } = await supabase
    .from("publicaciones")
    .insert({
      empresa_id: empresaId,
      red,
      fecha_programada: ejecutadoAt.slice(0, 10),
      hora_programada: ejecutadoAt.slice(11, 16),
      pilar: "prueba_tecnica",
      formato: "texto",
      titular,
      copy,
      hashtags: [],
      cta: "Escríbenos por mensaje directo",
      idea_visual: "Publicación de prueba técnica de conexión.",
      estado,
      generado_por_ia: true,
      publicado_at: ok ? ejecutadoAt : null,
    })
    .select("id")
    .maybeSingle();

  await registrarEvento(
    empresaId,
    red,
    ok ? "conectada" : conexion?.estado === "conectada" ? "error" : "pendiente",
    `Prueba de publicación (${modo}): ${detalle}`,
  );

  return {
    red,
    empresa: empresa.nombre,
    modo,
    ok,
    estado,
    titular,
    copy,
    detalle,
    referenciaExterna,
    publicacionId: insertada?.id ?? null,
    ejecutadoAt,
  };
}

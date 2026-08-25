import { generateText } from "ai";

import {
  createLovableAiGatewayProvider,
  MODELO_TEXTO,
  requireGatewayKey,
} from "./ai-gateway.server";
import { crearClienteServidor } from "./rutina.server";
import { PERMISOS_REQUERIDOS, registrarEvento, type Red } from "./conexiones.server";
import { descifrar } from "./cripto.server";

/** Estado tipado de la acción de prueba; el cliente decide qué alerta mostrar. */
export type EstadoPrueba = "publicada" | "pending_oauth" | "error_red";

export type ResultadoPrueba = {
  red: Red;
  empresa: string;
  modo: "real" | "simulada";
  ok: boolean;
  resultado: EstadoPrueba;
  estado: string;
  requisitos: string[];
  titular: string;
  copy: string;
  detalle: string;
  referenciaExterna: string | null;
  publicacionId: string | null;
  ejecutadoAt: string;
};

type EmpresaPrueba = {
  nombre: string;
  giro: string | null;
  zonas: string | null;
  tono: string | null;
  whatsapp: string | null;
};

const NOMBRE_RED: Record<Red, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

/** Texto local de respaldo: nunca depende de servicios externos. */
function pruebaLocal(empresa: EmpresaPrueba, red: Red) {
  return {
    titular: `Prueba de canal ${NOMBRE_RED[red]} · ${empresa.nombre}`,
    copy: `Publicación de prueba del canal oficial de ${empresa.nombre}${
      empresa.zonas ? ` (${empresa.zonas})` : ""
    }. Escríbenos por mensaje directo${
      empresa.whatsapp ? ` o WhatsApp ${empresa.whatsapp}` : ""
    } para más información.`,
  };
}

/**
 * Genera un texto corto de prueba con la voz de la empresa.
 * Si la IA no responde a tiempo o falla, se usa el texto local: la prueba nunca
 * debe quedar colgada ni lanzar un error global.
 */
async function redactarPrueba(empresa: EmpresaPrueba, red: Red) {
  const respaldo = pruebaLocal(empresa, red);
  try {
    const gateway = createLovableAiGatewayProvider(requireGatewayKey());
    const { text } = await generateText({
      model: gateway(MODELO_TEXTO),
      abortSignal: AbortSignal.timeout(20_000),
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
    const titular = (lineas[0] ?? respaldo.titular).replace(/^["']|["']$/g, "").slice(0, 110);
    const copy = lineas.slice(1).join("\n").trim() || respaldo.copy;
    return { titular, copy };
  } catch (e) {
    console.error("Prueba: la redacción con IA falló, se usa texto local.", e);
    return respaldo;
  }
}

/** Publica en la página de Facebook cuando la conexión está aprobada. */
async function publicarEnFacebook(token: string, cuentaId: string, mensaje: string) {
  if (!cuentaId) throw new Error("La conexión no tiene una página oficial seleccionada.");
  const url = new URL(`https://graph.facebook.com/v21.0/${cuentaId}/feed`);
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: mensaje, access_token: token }),
    signal: AbortSignal.timeout(20_000),
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
 * Si la red no tiene OAuth, token o permisos aprobados devuelve `pending_oauth`
 * con los requisitos pendientes, sin llamar a servicios externos, sin marcar
 * nada como publicado y sin lanzar errores hacia la interfaz.
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
    .select("estado, cuenta_externa_id, cuenta_externa_nombre, permisos_otorgados")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();

  const requeridos = PERMISOS_REQUERIDOS[red];
  const otorgados = conexion?.permisos_otorgados ?? [];
  const faltantes = requeridos.filter((p) => !otorgados.includes(p));

  const { data: filaToken } = await supabase
    .from("conexiones_tokens")
    .select("access_token_cifrado")
    .eq("empresa_id", empresaId)
    .eq("red", red)
    .maybeSingle();

  const requisitos: string[] = [];
  if (conexion?.estado !== "conectada") {
    requisitos.push(`Autorizar ${NOMBRE_RED[red]} con OAuth desde la pantalla Conexiones.`);
  }
  if (!filaToken?.access_token_cifrado) {
    requisitos.push("Guardar una autorización vigente (no hay token válido almacenado).");
  }
  if (faltantes.length) {
    requisitos.push(`Aprobar los permisos pendientes: ${faltantes.join(", ")}.`);
  }
  if (red === "instagram" && requisitos.length === 0) {
    requisitos.push(
      "Instagram exige una imagen o video alojado públicamente; la prueba de solo texto no se envía.",
    );
  }
  if (red === "tiktok" && requisitos.length === 0) {
    requisitos.push(
      "TikTok solo acepta publicaciones con video mediante la Content Posting API aprobada.",
    );
  }

  const pendiente = requisitos.length > 0;

  // Sin OAuth/token/permisos no se llama a ninguna red ni a la IA: registro interno.
  if (pendiente) {
    const { titular, copy } = pruebaLocal(empresa, red);
    const detalle = `Prueba registrada solo en la trazabilidad interna: falta completar la configuración de ${NOMBRE_RED[red]}.`;
    const publicacionId = await registrarPrueba(
      supabase,
      empresaId,
      red,
      titular,
      copy,
      "en_cola",
      ejecutadoAt,
      false,
    );
    await registrarEvento(empresaId, red, "pendiente", `Prueba (pending_oauth): ${detalle}`);
    return {
      red,
      empresa: empresa.nombre,
      modo: "simulada",
      ok: false,
      resultado: "pending_oauth",
      estado: "en_cola",
      requisitos,
      titular,
      copy,
      detalle,
      referenciaExterna: null,
      publicacionId,
      ejecutadoAt,
    };
  }

  const { titular, copy } = await redactarPrueba(empresa, red);
  const mensaje = `${titular}\n\n${copy}`;

  let referenciaExterna: string | null = null;
  let ok = false;
  let detalle = "";
  try {
    referenciaExterna = await publicarEnFacebook(
      descifrar(filaToken!.access_token_cifrado),
      conexion?.cuenta_externa_id ?? "",
      mensaje,
    );
    ok = true;
    detalle = `Publicación real enviada a ${conexion?.cuenta_externa_nombre ?? "la página oficial"}.`;
  } catch (e) {
    detalle = `${NOMBRE_RED[red]} rechazó la prueba: ${(e as Error).message}`;
  }

  const estado = ok ? "publicado" : "error";
  const publicacionId = await registrarPrueba(
    supabase,
    empresaId,
    red,
    titular,
    copy,
    estado,
    ejecutadoAt,
    ok,
  );
  await registrarEvento(
    empresaId,
    red,
    ok ? "conectada" : "error",
    `Prueba de publicación (real): ${detalle}`,
  );

  return {
    red,
    empresa: empresa.nombre,
    modo: "real",
    ok,
    resultado: ok ? "publicada" : "error_red",
    estado,
    requisitos: [],
    titular,
    copy,
    detalle,
    referenciaExterna,
    publicacionId,
    ejecutadoAt,
  };
}

/** Guarda la pieza de prueba en la cola interna con su trazabilidad. */
async function registrarPrueba(
  supabase: ReturnType<typeof crearClienteServidor>,
  empresaId: string,
  red: Red,
  titular: string,
  copy: string,
  estado: string,
  ejecutadoAt: string,
  publicado: boolean,
) {
  const { data } = await supabase
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
      publicado_at: publicado ? ejecutadoAt : null,
    })
    .select("id")
    .maybeSingle();
  return data?.id ?? null;
}

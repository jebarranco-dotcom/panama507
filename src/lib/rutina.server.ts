import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import type { Database } from "@/integrations/supabase/types";
import {
  MODELO_TEXTO,
  createLovableAiGatewayProvider,
  parsearJson,
  requireGatewayKey,
} from "./ai-gateway.server";
import { estrategiaDe, nombrePilar } from "./estrategia";

/**
 * Cliente de servidor con credenciales de servicio.
 * Las tablas internas solo permiten acceso autenticado, por lo que la
 * automatización (cron/webhook) debe usar la clave de servicio del servidor.
 */
export function crearClienteServidor() {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type Cliente = ReturnType<typeof crearClienteServidor>;

type EmpresaFila = {
  id: string;
  slug: string;
  nombre: string;
  giro: string;
  tono: string;
  whatsapp: string;
  zonas: string;
};

async function cargarEmpresa(supabase: Cliente, empresaId?: string): Promise<EmpresaFila> {
  const consulta = supabase
    .from("empresas")
    .select("id, slug, nombre, giro, tono, whatsapp, zonas")
    .eq("activa", true);
  const { data, error } = empresaId
    ? await consulta.eq("id", empresaId).maybeSingle()
    : await consulta.order("created_at").limit(1).maybeSingle();
  if (error || !data) throw new Error("Empresa no encontrada");
  return data as EmpresaFila;
}

export async function listarEmpresasActivas() {
  const supabase = crearClienteServidor();
  const { data, error } = await supabase
    .from("empresas")
    .select("id, nombre")
    .eq("activa", true)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data ?? [];
}

function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

async function pedirTexto(prompt: string, system: string) {
  const gateway = createLovableAiGatewayProvider(requireGatewayKey());
  const resultado = await generateText({
    model: gateway(MODELO_TEXTO),
    system,
    prompt,
  });
  return resultado.text;
}

function systemContenido(empresa: EmpresaFila) {
  return `Eres el estratega de redes sociales de ${empresa.nombre}, empresa de ${empresa.giro}.
Zonas donde opera: ${empresa.zonas || "Panamá"}.
Escribes en español con tono ${empresa.tono || "cercano, profesional y directo"}.
Reglas: copys listos para publicar, sin markdown, sin comillas alrededor del texto, emojis con moderación (máximo 3),
llamados a la acción concretos hacia mensaje directo o WhatsApp${empresa.whatsapp ? ` (${empresa.whatsapp})` : ""},
y nunca inventes precios distintos a los datos entregados.
Responde SIEMPRE únicamente con JSON válido, sin explicaciones ni bloques de código.`;
}

type PostGenerado = {
  red: string;
  hora_programada: string;
  pilar: string;
  formato: string;
  titular: string;
  copy: string;
  hashtags: string[];
  cta: string;
  idea_visual: string;
  propiedad_titulo?: string | null;
};

/** Genera y programa el contenido de un día para las 3 redes de una empresa. */
export async function generarContenidoDelDia(fecha?: string, empresaId?: string) {
  const supabase = crearClienteServidor();
  const empresa = await cargarEmpresa(supabase, empresaId);
  const dia = fecha ?? hoyISO();

  const { data: existentes } = await supabase
    .from("publicaciones")
    .select("id")
    .eq("empresa_id", empresa.id)
    .eq("fecha_programada", dia);
  if (existentes && existentes.length > 0) {
    return { fecha: dia, creadas: 0, mensaje: "Ya existe contenido para esa fecha" };
  }

  const { data: propiedades } = await supabase
    .from("propiedades")
    .select("id, titulo, operacion, tipo, precio, moneda, habitaciones, banos, area_m2, ubicacion, descripcion")
    .eq("empresa_id", empresa.id)
    .eq("estado", "disponible")
    .limit(12);

  const { data: recientes } = await supabase
    .from("publicaciones")
    .select("titular")
    .eq("empresa_id", empresa.id)
    .order("fecha_programada", { ascending: false })
    .limit(12);

  const { plan: planBase, tipo } = estrategiaDe(empresa.slug);
  const { programacionDe } = await import("./programacion.server");
  const programada = (await programacionDe(empresa.id)).filter((f) => f.activo);
  const planDiario = (programada.length ? programada : planBase).map((f) => ({
    red: f.red,
    hora: f.hora,
    pilar: f.pilar || planBase.find((b) => b.red === f.red)?.pilar || "educativo",
    formato: f.formato || planBase.find((b) => b.red === f.red)?.formato || "imagen",
  }));
  const etiquetaCatalogo = tipo === "servicios" ? "Portafolio de servicios" : "Inventario";
  const plan = planDiario.map(
    (p) => `- red: ${p.red}, hora: ${p.hora}, pilar: ${p.pilar} (${nombrePilar(p.pilar)}), formato: ${p.formato}`,
  ).join("\n");


  const prompt = `Fecha de publicación: ${dia}.

Genera EXACTAMENTE ${planDiario.length} publicaciones siguiendo este plan diario (respeta la hora indicada en cada línea):
${plan}

${etiquetaCatalogo} disponible (usa datos reales de aquí cuando el pilar lo requiera):
${JSON.stringify(propiedades ?? [], null, 1)}

Titulares publicados recientemente (NO los repitas ni los parafrasees):
${(recientes ?? []).map((r) => `- ${r.titular}`).join("\n")}

Devuelve un JSON con esta forma:
{"publicaciones":[{"red":"instagram","hora_programada":"09:00","pilar":"propiedad_destacada","formato":"carrusel","titular":"...","copy":"...","hashtags":["#..."],"cta":"...","idea_visual":"...","propiedad_titulo":"título exacto del inventario o null"}]}

Requisitos por publicación: titular de máximo 70 caracteres; copy de 400 a 700 caracteres con saltos de línea reales;
entre 4 y 6 hashtags relevantes al mercado local; idea_visual describiendo tomas o diseño concreto.
${tipo === "servicios" ? "No prometas resultados garantizados ni decisiones de terceros; enfócate en el problema que resuelve el servicio, el entregable y el seguimiento documentado. No inventes precios: si no hay tarifa, invita a una cotización." : ""}`;

  const texto = await pedirTexto(prompt, systemContenido(empresa));
  const parsed = parsearJson<{ publicaciones: PostGenerado[] }>(texto);

  const filas = (parsed.publicaciones ?? []).slice(0, planDiario.length).map((p, i) => {
    const base = planDiario[i % planDiario.length]!;
    const prop = (propiedades ?? []).find(
      (x) => p.propiedad_titulo && x.titulo.toLowerCase() === p.propiedad_titulo.toLowerCase(),
    );
    return {
      empresa_id: empresa.id,
      fecha_programada: dia,
      // La hora y la red las manda la programación de la empresa, no la IA.
      hora_programada: base.hora,
      red: base.red,

      pilar: p.pilar || base.pilar,
      formato: p.formato || base.formato,
      titular: (p.titular ?? "").slice(0, 120),
      copy: p.copy ?? "",
      hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, 8) : [],
      cta: p.cta ?? "",
      idea_visual: p.idea_visual ?? "",
      estado: "programado",
      propiedad_id: prop?.id ?? null,
      generado_por_ia: true,
    };
  });

  if (filas.length === 0) return { fecha: dia, creadas: 0, mensaje: "La IA no devolvió contenido" };

  const { error } = await supabase.from("publicaciones").insert(filas);
  if (error) throw new Error(error.message);

  return { fecha: dia, creadas: filas.length, mensaje: "Contenido diario generado" };
}

/**
 * Publica las piezas cuya hora ya pasó. Mientras las redes no estén conectadas
 * la publicación queda registrada como enviada por la cola interna.
 */
export async function publicarPendientes(empresaId?: string) {
  const supabase = crearClienteServidor();
  const empresa = await cargarEmpresa(supabase, empresaId);
  const dia = hoyISO();
  const ahora = new Date().toISOString().slice(11, 16);

  const { data: cuentas } = await supabase
    .from("cuentas_sociales")
    .select("red, conectada")
    .eq("empresa_id", empresa.id);
  const conectadas = new Set((cuentas ?? []).filter((c) => c.conectada).map((c) => c.red));

  const { data: pendientes } = await supabase
    .from("publicaciones")
    .select("id, red, hora_programada")
    .eq("empresa_id", empresa.id)
    .eq("estado", "programado")
    .lte("fecha_programada", dia);

  const listas = (pendientes ?? []).filter((p) => p.hora_programada <= ahora);
  let publicadas = 0;
  let enCola = 0;

  for (const p of listas) {
    if (conectadas.has(p.red)) {
      await supabase
        .from("publicaciones")
        .update({ estado: "publicado", publicado_at: new Date().toISOString() })
        .eq("id", p.id);
      publicadas++;
    } else {
      await supabase.from("publicaciones").update({ estado: "en_cola" }).eq("id", p.id);
      enCola++;
    }
  }

  return { publicadas, enCola, revisadas: listas.length };
}

/** Sugiere una respuesta para un mensaje entrante. */
export async function redactarRespuesta(mensajeId: string) {
  const supabase = crearClienteServidor();
  const { data: mensaje, error } = await supabase
    .from("mensajes")
    .select("id, red, remitente, mensaje, intencion, notas, empresa_id")
    .eq("id", mensajeId)
    .maybeSingle();
  if (error || !mensaje) throw new Error("Mensaje no encontrado");

  const empresa = await cargarEmpresa(supabase, mensaje.empresa_id);

  const { data: propiedades } = await supabase
    .from("propiedades")
    .select("titulo, operacion, precio, moneda, habitaciones, banos, area_m2, ubicacion")
    .eq("empresa_id", empresa.id)
    .eq("estado", "disponible")
    .limit(10);

  const texto = await pedirTexto(
    `Mensaje recibido por ${mensaje.red} de ${mensaje.remitente}:
"${mensaje.mensaje}"
Intención detectada: ${mensaje.intencion}. Notas internas: ${mensaje.notas || "ninguna"}.

Catálogo disponible: ${JSON.stringify(propiedades ?? [])}

Devuelve JSON: {"respuesta":"...","siguiente_paso":"...","prioridad":"alta|media|baja"}
La respuesta debe tener máximo 400 caracteres, saludar por el nombre, resolver la duda con datos reales
y cerrar proponiendo una reunión, visita o el envío de la ficha por WhatsApp.`,
    systemContenido(empresa),
  );

  return parsearJson<{ respuesta: string; siguiente_paso: string; prioridad: string }>(texto);
}

/** Genera (o regenera) el informe de trabajo del día. */
export async function generarInformeDiario(fecha?: string, empresaId?: string) {
  const supabase = crearClienteServidor();
  const empresa = await cargarEmpresa(supabase, empresaId);
  const dia = fecha ?? hoyISO();

  const { data: publicaciones } = await supabase
    .from("publicaciones")
    .select("red, pilar, titular, estado, alcance, likes, comentarios, clics, leads")
    .eq("empresa_id", empresa.id)
    .eq("fecha_programada", dia);

  const { data: mensajes } = await supabase
    .from("mensajes")
    .select("red, estado, intencion, prioridad, created_at")
    .eq("empresa_id", empresa.id)
    .gte("created_at", `${dia}T00:00:00Z`)
    .lte("created_at", `${dia}T23:59:59Z`);

  const pubs = publicaciones ?? [];
  const msgs = mensajes ?? [];
  const publicadas = pubs.filter((p) => p.estado === "publicado");
  const alcance = pubs.reduce((s, p) => s + (p.alcance ?? 0), 0);
  const leads = pubs.reduce((s, p) => s + (p.leads ?? 0), 0);
  const atendidos = msgs.filter((m) => m.estado === "respondido" || m.estado === "cerrado").length;

  const porRed = pubs.reduce<Record<string, number>>((acc, p) => {
    acc[p.red] = (acc[p.red] ?? 0) + (p.alcance ?? 0);
    return acc;
  }, {});
  const mejorRed = Object.entries(porRed).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "instagram";

  const texto = await pedirTexto(
    `Genera el informe de trabajo del ${dia} para la gerencia de ${empresa.nombre}.

Publicaciones del día: ${JSON.stringify(pubs)}
Mensajes del día: ${JSON.stringify(msgs)}
Alcance total: ${alcance}. Leads: ${leads}. Mensajes atendidos: ${atendidos} de ${msgs.length}.

Devuelve JSON: {"resumen":"2 a 4 oraciones sobre lo realizado y su resultado","logros":["...","...","..."],"recomendaciones":["...","...","..."]}`,
    systemContenido(empresa),
  );
  const ia = parsearJson<{ resumen: string; logros: string[]; recomendaciones: string[] }>(texto);

  const fila = {
    empresa_id: empresa.id,
    fecha: dia,
    resumen: ia.resumen ?? "",
    publicaciones_publicadas: publicadas.length,
    publicaciones_programadas: pubs.length,
    mensajes_recibidos: msgs.length,
    mensajes_atendidos: atendidos,
    leads_nuevos: leads,
    alcance_total: alcance,
    mejor_red: mejorRed,
    logros: (ia.logros ?? []).slice(0, 6),
    recomendaciones: (ia.recomendaciones ?? []).slice(0, 6),
  };

  const { error } = await supabase
    .from("informes_diarios")
    .upsert(fila, { onConflict: "empresa_id,fecha" });
  if (error) throw new Error(error.message);
  return fila;
}

/** Rutina completa de una empresa: contenido de hoy y mañana, cola e informe. */
export async function ejecutarRutinaEmpresa(empresaId?: string) {
  const contenidoHoy = await generarContenidoDelDia(hoyISO(), empresaId);
  const contenidoManana = await generarContenidoDelDia(hoyISO(1), empresaId);
  const publicacion = await publicarPendientes(empresaId);
  const informe = await generarInformeDiario(hoyISO(), empresaId);
  return { contenidoHoy, contenidoManana, publicacion, informe };
}

/** Rutina diaria para todas las empresas activas (usada por el cron). */
export async function ejecutarRutinaDiaria(empresaId?: string) {
  if (empresaId) {
    const resultado = await ejecutarRutinaEmpresa(empresaId);
    return { empresas: [{ empresaId, ...resultado }] };
  }
  const empresas = await listarEmpresasActivas();
  const resultados = [];
  for (const e of empresas) {
    try {
      resultados.push({ empresaId: e.id, nombre: e.nombre, ...(await ejecutarRutinaEmpresa(e.id)) });
    } catch (error) {
      resultados.push({
        empresaId: e.id,
        nombre: e.nombre,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
  return { empresas: resultados };
}

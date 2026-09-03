import { createHmac, timingSafeEqual } from "node:crypto";

import { crearClienteServidor } from "./rutina.server";
import { leerCredencial, registrarEvento } from "./conexiones.server";

type Evento = {
  object?: string;
  entry?: {
    id?: string;
    messaging?: {
      sender?: { id?: string };
      recipient?: { id?: string };
      timestamp?: number;
      message?: { mid?: string; text?: string; is_echo?: boolean };
    }[];
  }[];
};

function firmaValida(cuerpo: string, firma: string, secreto: string) {
  const esperado = "sha256=" + createHmac("sha256", secreto).update(cuerpo).digest("hex");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clasificar(texto: string) {
  const t = texto.toLowerCase();
  if (/(precio|cu[aá]nto|costo|valor|tarifa|honorario)/.test(t)) return "precio";
  if (/(cita|visita|reuni[oó]n|agendar)/.test(t)) return "cita";
  if (/(alquil|rent|arrend)/.test(t)) return "alquiler";
  if (/(compra|vender|venta)/.test(t)) return "compraventa";
  if (/(tr[aá]mite|asesor|gesti[oó]n|documento)/.test(t)) return "tramite";
  return "consulta";
}

/**
 * Valida la firma del webhook contra el secreto de la app de la empresa dueña
 * de la página y registra los mensajes entrantes en la bandeja.
 */
export async function procesarWebhookMeta(cuerpo: string, firma: string) {
  if (!firma) return { ok: false, detalle: "Falta la firma del webhook." };

  let evento: Evento;
  try {
    evento = JSON.parse(cuerpo) as Evento;
  } catch {
    return { ok: false, detalle: "Cuerpo del webhook no válido." };
  }

  const supabase = crearClienteServidor();
  const red = evento.object === "instagram" ? "instagram" : "facebook";

  for (const entrada of evento.entry ?? []) {
    const paginaId = entrada.id ?? "";
    if (!paginaId) continue;

    const { data: conexion } = await supabase
      .from("conexiones_redes")
      .select("empresa_id")
      .eq("red", red)
      .eq("cuenta_externa_id", paginaId)
      .maybeSingle();
    if (!conexion) continue;

    const cred = await leerCredencial(conexion.empresa_id, "meta");
    if (!cred || !firmaValida(cuerpo, firma, cred.clientSecret)) {
      return { ok: false, detalle: "Firma del webhook no válida." };
    }

    for (const m of entrada.messaging ?? []) {
      const texto = m.message?.text;
      const remitente = m.sender?.id ?? "";
      if (!texto || m.message?.is_echo || remitente === paginaId) continue;

      const referencia = m.message?.mid ?? `${remitente}:${m.timestamp ?? Date.now()}`;
      const creado = new Date(m.timestamp ?? Date.now()).toISOString();

      const { data: conv } = await supabase
        .from("conversaciones")
        .select("id, lead_id")
        .eq("empresa_id", conexion.empresa_id)
        .eq("red", red)
        .eq("referencia_externa", `psid:${remitente}`)
        .maybeSingle();

      let conversacionId = conv?.id ?? null;
      let leadId = conv?.lead_id ?? null;

      if (!conversacionId) {
        const { data: creada } = await supabase
          .from("conversaciones")
          .insert({
            empresa_id: conexion.empresa_id,
            red,
            tipo: "mensaje",
            participante: "Contacto de la red",
            usuario_participante: remitente,
            referencia_externa: `psid:${remitente}`,
            estado: "nuevo",
            ultimo_mensaje_at: creado,
          })
          .select("id")
          .single();
        conversacionId = creada?.id ?? null;
      } else {
        await supabase
          .from("conversaciones")
          .update({ ultimo_mensaje_at: creado, updated_at: new Date().toISOString() })
          .eq("id", conversacionId);
      }

      if (!leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .insert({
            empresa_id: conexion.empresa_id,
            nombre: "Contacto de la red",
            red,
            usuario_red: remitente,
            interes: clasificar(texto),
            etapa: "nuevo",
            notas: "Lead creado por el webhook de mensajería.",
            ultimo_contacto_at: creado,
          })
          .select("id")
          .single();
        leadId = lead?.id ?? null;
        if (leadId && conversacionId) {
          await supabase.from("conversaciones").update({ lead_id: leadId }).eq("id", conversacionId);
        }
      }

      const intencion = clasificar(texto);
      await supabase.from("mensajes").upsert(
        {
          empresa_id: conexion.empresa_id,
          red,
          remitente: "Contacto de la red",
          usuario_remitente: remitente,
          mensaje: texto,
          intencion,
          prioridad: intencion === "cita" || intencion === "precio" ? "alta" : "media",
          estado: "nuevo",
          conversacion_id: conversacionId,
          lead_id: leadId,
          referencia_externa: referencia,
          created_at: creado,
        },
        { onConflict: "empresa_id,red,referencia_externa", ignoreDuplicates: true },
      );

      await registrarEvento(
        conexion.empresa_id,
        red,
        "mensaje_entrante",
        "Mensaje recibido por webhook y registrado en la bandeja para revisión humana.",
      );
    }
  }

  return { ok: true, detalle: "Eventos procesados." };
}

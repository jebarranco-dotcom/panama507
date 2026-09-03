import { crearClienteServidor } from "./rutina.server";
import { descifrar } from "./cripto.server";
import { registrarEvento, type Red } from "./conexiones.server";

/** Permisos que Meta debe haber aprobado para leer la bandeja de cada red. */
export const PERMISOS_MENSAJERIA: Record<"facebook" | "instagram", string[]> = {
  facebook: ["pages_messaging", "pages_manage_metadata"],
  instagram: ["instagram_manage_messages"],
};

export type ResultadoBandeja =
  | {
      estado: "pending_oauth";
      red: Red;
      detalle: string;
      requisitos: string[];
      nuevas: 0;
      mensajes: 0;
    }
  | {
      estado: "ok" | "error";
      red: Red;
      detalle: string;
      requisitos: string[];
      nuevas: number;
      mensajes: number;
    };

type Conexion = {
  estado: string;
  cuenta_externa_id: string;
  cuenta_externa_nombre: string;
  permisos_otorgados: string[];
};

const GRAPH = "https://graph.facebook.com/v21.0";

async function conexionYToken(empresaId: string, red: "facebook" | "instagram") {
  const supabase = crearClienteServidor();
  const [{ data: conexion }, { data: token }] = await Promise.all([
    supabase
      .from("conexiones_redes")
      .select("estado, cuenta_externa_id, cuenta_externa_nombre, permisos_otorgados")
      .eq("empresa_id", empresaId)
      .eq("red", red)
      .maybeSingle(),
    supabase
      .from("conexiones_tokens")
      .select("access_token_cifrado")
      .eq("empresa_id", empresaId)
      .eq("red", red)
      .maybeSingle(),
  ]);
  return {
    conexion: (conexion ?? null) as Conexion | null,
    token: token?.access_token_cifrado ? descifrar(token.access_token_cifrado) : null,
  };
}

function pendiente(red: Red, detalle: string, requisitos: string[]): ResultadoBandeja {
  return { estado: "pending_oauth", red, detalle, requisitos, nuevas: 0, mensajes: 0 };
}

/** Token de la página vinculada (necesario para leer la bandeja de Facebook e Instagram). */
async function tokenDePagina(paginaId: string, tokenUsuario: string) {
  const res = await fetch(
    `${GRAPH}/${paginaId}?fields=access_token,name&access_token=${encodeURIComponent(tokenUsuario)}`,
  );
  const json = (await res.json()) as {
    access_token?: string;
    name?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message ?? "Meta no entregó el token de la página vinculada.");
  }
  return { token: json.access_token, nombre: json.name ?? "" };
}

type MensajeGraph = {
  id: string;
  message?: string;
  created_time?: string;
  from?: { id?: string; name?: string; username?: string };
};

type ConversacionGraph = {
  id: string;
  updated_time?: string;
  participants?: { data?: { id: string; name?: string; username?: string }[] };
  messages?: { data?: MensajeGraph[] };
};

function clasificar(texto: string) {
  const t = texto.toLowerCase();
  if (/(precio|cu[aá]nto|costo|valor|tarifa|honorario)/.test(t)) return "precio";
  if (/(cita|visita|reuni[oó]n|agendar|ver la propiedad)/.test(t)) return "cita";
  if (/(alquil|rent|arrend)/.test(t)) return "alquiler";
  if (/(compra|vender|venta)/.test(t)) return "compraventa";
  if (/(tr[aá]mite|asesor|gesti[oó]n|documento)/.test(t)) return "tramite";
  return "consulta";
}

/**
 * Descarga las conversaciones reales de la red indicada y las registra en la bandeja.
 * Nunca responde ni escribe en la red: solo lee e inserta para revisión humana.
 */
export async function sincronizarBandeja(
  empresaId: string,
  red: "facebook" | "instagram",
): Promise<ResultadoBandeja> {
  const requisitos = PERMISOS_MENSAJERIA[red];
  const { conexion, token } = await conexionYToken(empresaId, red);

  if (!conexion || !token || conexion.estado === "pendiente" || conexion.estado === "error") {
    return pendiente(
      red,
      "La red todavía no tiene una autorización de Meta vigente. Autoriza la página o cuenta en Conexiones para recoger conversaciones reales.",
      requisitos,
    );
  }
  if (!conexion.cuenta_externa_id) {
    return pendiente(
      red,
      "Falta vincular la página de Facebook (y la cuenta profesional de Instagram) a esta empresa.",
      requisitos,
    );
  }
  const otorgados = conexion.permisos_otorgados ?? [];
  const faltantes = requisitos.filter((p) => !otorgados.includes(p));
  if (faltantes.length) {
    return pendiente(
      red,
      "Meta aún no aprobó los permisos de mensajería para esta cuenta.",
      faltantes,
    );
  }

  const supabase = crearClienteServidor();
  try {
    const pagina = await tokenDePagina(conexion.cuenta_externa_id, token);
    const url = new URL(`${GRAPH}/${conexion.cuenta_externa_id}/conversations`);
    url.searchParams.set(
      "fields",
      "id,updated_time,participants,messages.limit(25){id,message,created_time,from}",
    );
    url.searchParams.set("limit", "25");
    if (red === "instagram") url.searchParams.set("platform", "instagram");
    url.searchParams.set("access_token", pagina.token);

    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const cuerpo = (await res.json()) as {
      data?: ConversacionGraph[];
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(cuerpo.error?.message ?? `Error HTTP ${res.status}`);

    let nuevas = 0;
    let insertados = 0;

    for (const conv of cuerpo.data ?? []) {
      const participante = (conv.participants?.data ?? []).find(
        (p) => p.id !== conexion.cuenta_externa_id,
      );
      const nombre = participante?.name ?? participante?.username ?? "Contacto sin nombre";
      const usuario = participante?.username ? `@${participante.username}` : (participante?.id ?? "");

      const { data: existente } = await supabase
        .from("conversaciones")
        .select("id, lead_id")
        .eq("empresa_id", empresaId)
        .eq("red", red)
        .eq("referencia_externa", conv.id)
        .maybeSingle();

      let conversacionId = existente?.id ?? null;
      let leadId = existente?.lead_id ?? null;

      if (!conversacionId) {
        const { data: creada, error } = await supabase
          .from("conversaciones")
          .insert({
            empresa_id: empresaId,
            red,
            tipo: "mensaje",
            participante: nombre,
            usuario_participante: usuario,
            referencia_externa: conv.id,
            estado: "nuevo",
            ultimo_mensaje_at: conv.updated_time ?? new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        conversacionId = creada.id;
        nuevas += 1;
      } else {
        await supabase
          .from("conversaciones")
          .update({
            participante: nombre,
            usuario_participante: usuario,
            ultimo_mensaje_at: conv.updated_time ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversacionId);
      }

      const entrantes = (conv.messages?.data ?? []).filter(
        (m) => m.message && m.from?.id && m.from.id !== conexion.cuenta_externa_id,
      );

      if (entrantes.length && !leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .insert({
            empresa_id: empresaId,
            nombre,
            red,
            usuario_red: usuario,
            interes: clasificar(entrantes[0].message ?? ""),
            etapa: "nuevo",
            notas: "Lead creado automáticamente desde la bandeja de la red.",
            ultimo_contacto_at: conv.updated_time ?? new Date().toISOString(),
          })
          .select("id")
          .single();
        leadId = lead?.id ?? null;
        if (leadId) {
          await supabase
            .from("conversaciones")
            .update({ lead_id: leadId })
            .eq("id", conversacionId);
        }
      }

      for (const m of entrantes) {
        const intencion = clasificar(m.message ?? "");
        const { error } = await supabase.from("mensajes").upsert(
          {
            empresa_id: empresaId,
            red,
            remitente: m.from?.name ?? nombre,
            usuario_remitente: usuario,
            mensaje: m.message ?? "",
            intencion,
            prioridad: intencion === "cita" || intencion === "precio" ? "alta" : "media",
            estado: "nuevo",
            conversacion_id: conversacionId,
            lead_id: leadId,
            referencia_externa: m.id,
            created_at: m.created_time ?? new Date().toISOString(),
          },
          { onConflict: "empresa_id,red,referencia_externa", ignoreDuplicates: true },
        );
        if (!error) insertados += 1;
      }
    }

    const detalle = `Bandeja sincronizada: ${cuerpo.data?.length ?? 0} conversación(es) leídas, ${nuevas} nueva(s), ${insertados} mensaje(s) registrados.`;
    await registrarEvento(empresaId, red, "bandeja_ok", detalle);
    return { estado: "ok", red, detalle, requisitos: [], nuevas, mensajes: insertados };
  } catch (e) {
    const detalle = `No se pudo leer la bandeja de ${red}: ${(e as Error).message}`;
    await registrarEvento(empresaId, red, "bandeja_error", detalle);
    return { estado: "error", red, detalle, requisitos, nuevas: 0, mensajes: 0 };
  }
}

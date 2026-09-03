import { crearClienteServidor } from "./rutina.server";

export type EstadoLog = "ok" | "error" | "omitido";

/** Registra una ejecución de automatización. Nunca lanza: el log no debe romper la rutina. */
export async function registrarLog(opciones: {
  empresaId?: string | null | undefined;
  proceso: string;
  estado?: EstadoLog;
  detalle?: string;
  duracionMs?: number;
  claveIdempotencia?: string | null | undefined;
}) {
  try {
    const supabase = crearClienteServidor();
    await supabase.from("logs_automatizacion").insert({
      empresa_id: opciones.empresaId ?? null,
      proceso: opciones.proceso,
      estado: opciones.estado ?? "ok",
      detalle: opciones.detalle ?? "",
      duracion_ms: Math.max(0, Math.round(opciones.duracionMs ?? 0)),
      clave_idempotencia: opciones.claveIdempotencia ?? null,
    });
  } catch {
    // silencioso a propósito
  }
}

/**
 * Reserva una ejecución única con la clave dada. Devuelve false si otra ejecución
 * ya la tomó (índice único), evitando publicaciones duplicadas.
 */
export async function reservarEjecucion(
  clave: string,
  proceso: string,
  empresaId?: string | null,
) {
  const supabase = crearClienteServidor();
  const { error } = await supabase.from("logs_automatizacion").insert({
    empresa_id: empresaId ?? null,
    proceso,
    estado: "omitido",
    detalle: "Ejecución reservada.",
    clave_idempotencia: clave,
  });
  return !error;
}

/** Guarda el resultado por red de una publicación (una fila por publicación y red). */
export async function registrarResultadoRed(datos: {
  empresaId: string;
  publicacionId: string;
  red: string;
  estado: "pendiente" | "en_cola" | "publicado" | "error";
  referenciaExterna?: string;
  intentos?: number;
  errorDetalle?: string;
}) {
  try {
    const supabase = crearClienteServidor();
    await supabase.from("publicaciones_redes").upsert(
      {
        empresa_id: datos.empresaId,
        publicacion_id: datos.publicacionId,
        red: datos.red,
        estado: datos.estado,
        referencia_externa: datos.referenciaExterna ?? "",
        intentos: datos.intentos ?? 0,
        error_detalle: datos.errorDetalle ?? "",
        publicado_at: datos.estado === "publicado" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "publicacion_id,red" },
    );
  } catch {
    // silencioso a propósito
  }
}

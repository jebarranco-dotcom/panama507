import { crearClienteServidor } from "./rutina.server";

/** Fija la hora diaria de salida: programación por red, piezas pendientes y disparador exacto. */
export async function fijarHoraCola(empresaId: string, hora: string) {
  const supabase = crearClienteServidor();
  const { programacionDe, guardarProgramacionDe } = await import("./programacion.server");
  const filas = await programacionDe(empresaId);
  await guardarProgramacionDe(empresaId, filas.map((f) => ({ ...f, hora })));
  const hoy = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
  await supabase
    .from("publicaciones")
    .update({ hora_programada: hora })
    .eq("empresa_id", empresaId)
    .in("estado", ["programado", "en_cola", "borrador"])
    .gte("fecha_programada", hoy);
  const { error } = await supabase.rpc("programar_hora_publicacion", {
    _empresa: empresaId,
    _hora: hora,
  });
  if (error) throw new Error(error.message);
  return { hora };
}

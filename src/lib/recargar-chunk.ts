const CLAVE = "chunk-recargado";

export function esErrorDeChunk(error: unknown): boolean {
  const mensaje =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return (
    /Failed to fetch dynamically imported module/i.test(mensaje) ||
    /error loading dynamically imported module/i.test(mensaje) ||
    /Importing a module script failed/i.test(mensaje)
  );
}

/**
 * Tras un despliegue nuevo, el HTML en caché del navegador apunta a archivos
 * con hash que ya no existen. Recargamos una sola vez para tomar la versión
 * nueva; el candado en sessionStorage evita bucles de recarga.
 */
export function recargarPorChunkObsoleto(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(CLAVE)) return false;
    sessionStorage.setItem(CLAVE, String(Date.now()));
  } catch {
    // sessionStorage bloqueado: recargamos igual, una vez por navegación.
  }
  window.location.reload();
  return true;
}

export function limpiarCandadoChunk() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // sin acceso a sessionStorage no hay candado que limpiar
  }
}

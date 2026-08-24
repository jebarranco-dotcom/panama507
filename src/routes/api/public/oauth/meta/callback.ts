import { createFileRoute } from "@tanstack/react-router";

function pagina(titulo: string, mensaje: string, ok: boolean) {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title>
<style>body{font-family:system-ui;background:#0b1220;color:#e8edf7;display:grid;place-items:center;height:100vh;margin:0}
main{max-width:32rem;padding:2rem;text-align:center}h1{font-size:1.15rem}p{color:#a9b6ce;font-size:.9rem;line-height:1.5}</style></head>
<body><main><h1>${ok ? "✅" : "⚠️"} ${titulo}</h1><p>${mensaje}</p></main>
<script>try{window.opener&&window.opener.postMessage({type:"oauth-red",ok:${ok}},window.location.origin)}catch(e){}setTimeout(function(){window.close()},2500)</script>
</body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

async function manejar({ request }: { request: Request }) {
  const url = new URL(request.url);
  const { verificarEstado } = await import("@/lib/cripto.server");
  let estado;
  try {
    estado = verificarEstado(url.searchParams.get("state"));
  } catch (e) {
    return pagina("Autorización no válida", (e as Error).message, false);
  }
  const { completarMeta, guardarError } = await import("@/lib/conexiones.server");
  const red = estado.red as "facebook" | "instagram";
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code) {
    const mensaje = error ?? "Meta no devolvió el código de autorización.";
    await guardarError(estado.empresaId, red, mensaje);
    return pagina("Autorización cancelada", mensaje, false);
  }
  try {
    const { origenPublico } = await import("@/lib/permisos.server");
    const redirectUri = `${origenPublico(request)}/api/public/oauth/meta/callback`;
    const resultado = await completarMeta(estado.empresaId, red, code, redirectUri);
    return pagina(
      resultado.conectada ? "Red conectada oficialmente" : "Autorización registrada",
      resultado.conectada
        ? "Los permisos de publicación quedaron aprobados. Ya puedes cerrar esta ventana."
        : `Faltan permisos o vinculación: ${resultado.faltantes.join(", ") || "revisa el detalle en el panel"}.`,
      resultado.conectada,
    );
  } catch (e) {
    const mensaje = (e as Error).message;
    await guardarError(estado.empresaId, red, mensaje);
    return pagina("No se pudo completar la conexión", mensaje, false);
  }
}

export const Route = createFileRoute("/api/public/oauth/meta/callback")({
  server: { handlers: { GET: manejar } },
});

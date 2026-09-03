import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook de mensajería de Meta (Facebook Messenger e Instagram Direct).
 *
 * GET  → verificación del webhook con el token de la app (solo comparación).
 * POST → mensajes entrantes; se valida la firma HMAC con el secreto de la app
 *        antes de registrar nada en la bandeja. Nunca responde al usuario.
 */
async function verificar({ request }: { request: Request }) {
  const url = new URL(request.url);
  const modo = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const esperado = process.env["META_WEBHOOK_VERIFY_TOKEN"];
  if (modo === "subscribe" && esperado && token === esperado) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("Verificación rechazada", { status: 403 });
}

async function recibir({ request }: { request: Request }) {
  const cuerpo = await request.text();
  const firma = request.headers.get("x-hub-signature-256") ?? "";
  const { procesarWebhookMeta } = await import("@/lib/webhook-meta.server");
  const resultado = await procesarWebhookMeta(cuerpo, firma);
  if (!resultado.ok) return new Response(resultado.detalle, { status: 401 });
  // Meta espera 200 siempre que el evento fue aceptado para no reintentar en bucle.
  return new Response("ok", { status: 200 });
}

export const Route = createFileRoute("/api/public/hooks/meta-mensajes")({
  server: { handlers: { GET: verificar, POST: recibir } },
});

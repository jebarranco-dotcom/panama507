import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const MODELO_TEXTO = "google/gemini-3.6-flash";

export function requireGatewayKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la configuración de Lovable AI");
  return key;
}

/** Extrae el primer objeto/arreglo JSON de una respuesta de texto. */
export function parsearJson<T>(texto: string): T {
  const limpio = texto
    .replace(/^[\s\S]*?```(?:json)?/i, (m) => (texto.includes("```") ? "" : m))
    .replace(/```[\s\S]*$/, "")
    .trim();
  const candidato = limpio.startsWith("{") || limpio.startsWith("[") ? limpio : texto.trim();
  const inicio = Math.min(
    ...[candidato.indexOf("{"), candidato.indexOf("[")].filter((i) => i >= 0),
  );
  const fin = Math.max(candidato.lastIndexOf("}"), candidato.lastIndexOf("]"));
  return JSON.parse(candidato.slice(inicio, fin + 1)) as T;
}

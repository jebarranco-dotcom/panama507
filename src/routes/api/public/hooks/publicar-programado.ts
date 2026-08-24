import { createFileRoute } from "@tanstack/react-router";

async function correr() {
  const { ejecutarProgramador } = await import("@/lib/publicador.server");
  try {
    const resultado = await ejecutarProgramador();
    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    console.error("publicar-programado", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/hooks/publicar-programado")({
  server: {
    handlers: {
      POST: correr,
      GET: correr,
    },
  },
});

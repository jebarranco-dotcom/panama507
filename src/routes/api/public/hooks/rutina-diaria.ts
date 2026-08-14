import { createFileRoute } from "@tanstack/react-router";

async function correr() {
  const { ejecutarRutinaDiaria } = await import("@/lib/rutina.server");
  try {
    const resultado = await ejecutarRutinaDiaria();
    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    console.error("rutina-diaria", error);
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/hooks/rutina-diaria")({
  server: {
    handlers: {
      POST: correr,
      GET: correr,
    },
  },
});

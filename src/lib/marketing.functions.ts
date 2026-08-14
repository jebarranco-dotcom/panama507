import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FechaInput = z.object({ fecha: z.string().optional() });

export const generarContenido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FechaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { generarContenidoDelDia } = await import("./rutina.server");
    return generarContenidoDelDia(data.fecha);
  });

export const generarInforme = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FechaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { generarInformeDiario } = await import("./rutina.server");
    return generarInformeDiario(data.fecha);
  });

export const publicarAhora = createServerFn({ method: "POST" }).handler(async () => {
  const { publicarPendientes } = await import("./rutina.server");
  return publicarPendientes();
});

export const sugerirRespuesta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ mensajeId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { redactarRespuesta } = await import("./rutina.server");
    return redactarRespuesta(data.mensajeId);
  });

export const correrRutina = createServerFn({ method: "POST" }).handler(async () => {
  const { ejecutarRutinaDiaria } = await import("./rutina.server");
  return ejecutarRutinaDiaria();
});

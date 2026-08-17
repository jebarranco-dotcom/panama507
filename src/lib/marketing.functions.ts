import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FechaInput = z.object({
  fecha: z.string().optional(),
  empresaId: z.string().uuid().optional(),
});
const EmpresaInput = z.object({ empresaId: z.string().uuid().optional() });

export const generarContenido = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FechaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { generarContenidoDelDia } = await import("./rutina.server");
    return generarContenidoDelDia(data.fecha, data.empresaId);
  });

export const generarInforme = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FechaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { generarInformeDiario } = await import("./rutina.server");
    return generarInformeDiario(data.fecha, data.empresaId);
  });

export const publicarAhora = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmpresaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { publicarPendientes } = await import("./rutina.server");
    return publicarPendientes(data.empresaId);
  });

export const sugerirRespuesta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ mensajeId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { redactarRespuesta } = await import("./rutina.server");
    return redactarRespuesta(data.mensajeId);
  });

export const correrRutina = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmpresaInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { ejecutarRutinaEmpresa } = await import("./rutina.server");
    return ejecutarRutinaEmpresa(data.empresaId);
  });

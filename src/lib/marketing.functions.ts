import { createServerFn } from "@tanstack/react-start";

import {
  EmpresaOpcionalInput,
  FechaInput,
  MensajeInput,
} from "@/lib/entradas.schemas";

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
  .inputValidator((input: unknown) => EmpresaOpcionalInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { publicarPendientes } = await import("./rutina.server");
    return publicarPendientes(data.empresaId);
  });

export const sugerirRespuesta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MensajeInput.parse(input))
  .handler(async ({ data }) => {
    const { redactarRespuesta } = await import("./rutina.server");
    return redactarRespuesta(data.mensajeId);
  });

export const correrRutina = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmpresaOpcionalInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const { ejecutarRutinaEmpresa } = await import("./rutina.server");
    return ejecutarRutinaEmpresa(data.empresaId);
  });

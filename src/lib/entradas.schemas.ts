import { z } from "zod";

/**
 * Esquemas de entrada compartidos por las funciones de servidor.
 *
 * Deben vivir fuera de los archivos `*.functions.ts`: el compilador de TanStack
 * divide esos módulos y elimina los hermanos del ámbito del módulo, de modo que
 * una constante declarada junto a un `createServerFn` puede quedar fuera del
 * chunk del servidor y provocar errores de identificador o `ReferenceError`.
 */
export const EmpresaInput = z.object({ empresaId: z.string().uuid() });

export const EmpresaOpcionalInput = z.object({ empresaId: z.string().uuid().optional() });

export const FechaInput = z.object({
  fecha: z.string().optional(),
  empresaId: z.string().uuid().optional(),
});

export const MensajeInput = z.object({ mensajeId: z.string().uuid() });

export const PiezaInput = z.object({
  empresaId: z.string().uuid(),
  publicacionId: z.string().uuid(),
});

export const ZonaHorariaInput = EmpresaInput.extend({
  zonaHoraria: z.string().min(3).max(64),
});

export const AprobacionInput = EmpresaInput.extend({ requiereAprobacion: z.boolean() });

export const EditarBorradorInput = PiezaInput.extend({
  titular: z.string().trim().min(3).max(120),
  copy: z.string().trim().min(10).max(2200),
  cta: z.string().trim().max(160).default(""),
  hashtags: z.array(z.string().trim().max(40)).max(10).default([]),
  mediaUrl: z.string().trim().max(600).default(""),
  horaProgramada: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:MM."),
});

export const RedInput = z.object({
  empresaId: z.string().uuid(),
  red: z.enum(["facebook", "instagram", "tiktok"]),
});

export const GuardarProgramacionInput = z.object({
  empresaId: z.string().uuid(),
  filas: z
    .array(
      z.object({
        red: z.enum(["facebook", "instagram", "tiktok"]),
        hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:MM en 24 horas."),
        pilar: z.string().trim().max(60),
        formato: z.string().trim().max(40),
        activo: z.boolean(),
      }),
    )
    .min(1)
    .max(3),
});

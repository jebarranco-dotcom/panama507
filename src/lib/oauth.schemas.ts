import { z } from "zod";

/**
 * Esquemas compartidos por las funciones de servidor de OAuth.
 *
 * Viven fuera de `oauth.functions.ts` a propósito: el compilador de TanStack
 * divide cada archivo con `createServerFn` y elimina los hermanos del ámbito del
 * módulo, así que cualquier constante declarada ahí puede desaparecer del chunk
 * del servidor (o cambiar el identificador de la función). Un archivo de
 * funciones debe contener solo importaciones, tipos y las declaraciones
 * exportadas de `createServerFn`.
 */
export const EmpresaInput = z.object({ empresaId: z.string().uuid() });

export const ProveedorInput = z.object({
  empresaId: z.string().uuid(),
  proveedor: z.enum(["meta", "tiktok"]),
});

export const IniciarInput = z.object({
  empresaId: z.string().uuid(),
  red: z.enum(["facebook", "instagram", "tiktok"]),
});

export const ActivoInput = z.object({
  empresaId: z.string().uuid(),
  red: z.enum(["facebook", "instagram"]),
  cuentaId: z.string().trim().min(1).max(64),
  cuentaNombre: z.string().trim().max(160).default(""),
});

export const CredencialInput = z.object({
  empresaId: z.string().uuid(),
  proveedor: z.enum(["meta", "tiktok"]),
  clientId: z
    .string()
    .trim()
    .min(6, "El identificador de la app es demasiado corto.")
    .max(120)
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "El identificador solo admite letras, números, punto, guion y guion bajo.",
    ),
  clientSecret: z
    .string()
    .trim()
    .min(16, "El secreto de la app debe tener al menos 16 caracteres.")
    .max(255)
    .regex(/^\S+$/, "El secreto no debe contener espacios."),
});

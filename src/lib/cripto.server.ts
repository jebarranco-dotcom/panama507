import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function clave(): Buffer {
  const raw = process.env["OAUTH_CRYPTO_KEY"];
  if (!raw) throw new Error("Falta OAUTH_CRYPTO_KEY en el servidor.");
  return createHash("sha256").update(raw).digest();
}

/** Cifra un secreto para guardarlo en base de datos (nunca en texto plano). */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", clave(), iv);
  const ct = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function descifrar(guardado: string): string {
  const buf = Buffer.from(guardado, "base64");
  const decipher = createDecipheriv("aes-256-gcm", clave(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

/** Pista no sensible: solo los últimos 4 caracteres. */
export function pistaDe(secreto: string): string {
  return `••••${secreto.slice(-4)}`;
}

type EstadoOAuth = { empresaId: string; red: string; proveedor: string; userId: string; exp: number };

function secretoEstado(): string {
  const raw = process.env["OAUTH_STATE_SECRET"];
  if (!raw) throw new Error("Falta OAUTH_STATE_SECRET en el servidor.");
  return raw;
}

/** Firma el parámetro `state` del flujo OAuth para que el callback sea verificable. */
export function firmarEstado(datos: Omit<EstadoOAuth, "exp">): string {
  const cuerpo = Buffer.from(
    JSON.stringify({ ...datos, exp: Date.now() + 10 * 60 * 1000 } satisfies EstadoOAuth),
  ).toString("base64url");
  const firma = createHmac("sha256", secretoEstado()).update(cuerpo).digest("base64url");
  return `${cuerpo}.${firma}`;
}

export function verificarEstado(state: string | null): EstadoOAuth {
  const [cuerpo, firma] = (state ?? "").split(".");
  if (!cuerpo || !firma) throw new Error("Estado de autorización inválido.");
  const esperada = createHmac("sha256", secretoEstado()).update(cuerpo).digest("base64url");
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("La firma del estado de autorización no coincide.");
  }
  const datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as EstadoOAuth;
  if (datos.exp < Date.now()) throw new Error("La autorización expiró, vuelve a intentarlo.");
  return datos;
}

import { crearClienteServidor } from "./rutina.server";

export type PublicadaReal = {
  id: string;
  red: "facebook" | "instagram";
  titular: string;
  publicadoAt: string | null;
  referencia: string;
  enlace: string;
  mediaUrl: string;
};

/** Publicaciones reales confirmadas por la red, con su enlace público. */
export async function listarPublicadasReales(empresaId: string): Promise<PublicadaReal[]> {
  const supabase = crearClienteServidor();
  const { data } = await supabase
    .from("publicaciones")
    .select("id, red, titular, publicado_at, referencia_externa, media_url")
    .eq("empresa_id", empresaId)
    .eq("estado", "publicado")
    .in("red", ["facebook", "instagram"])
    .neq("referencia_externa", "")
    .order("publicado_at", { ascending: false })
    .limit(60);
  const { tokenPublicacion } = await import("./token-sistema.server");
  const tokenIg = await tokenPublicacion(empresaId, "instagram").catch(() => null);
  return Promise.all(
    (data ?? []).map(async (p) => {
      let enlace = `https://www.facebook.com/${p.referencia_externa}`;
      if (p.red === "instagram") {
        enlace = "";
        if (tokenIg) {
          try {
            const r = await fetch(
              `https://graph.facebook.com/v21.0/${p.referencia_externa}?fields=permalink&access_token=${encodeURIComponent(tokenIg)}`,
              { signal: AbortSignal.timeout(8000) },
            );
            const j = (await r.json()) as { permalink?: string };
            enlace = j.permalink ?? "";
          } catch {
            enlace = "";
          }
        }
      }
      return {
        id: p.id,
        red: p.red as "facebook" | "instagram",
        titular: p.titular,
        publicadoAt: p.publicado_at,
        referencia: p.referencia_externa,
        enlace,
        mediaUrl: p.media_url,
      };
    }),
  );
}

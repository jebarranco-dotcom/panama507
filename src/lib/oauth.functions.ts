import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProveedorOAuth = "meta" | "tiktok";

const ProveedorInput = z.object({ proveedor: z.enum(["meta", "tiktok"]) });

const SCOPES_META = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

const SCOPES_TIKTOK = ["user.info.basic", "video.publish", "video.upload"];

/** Qué credenciales de app están configuradas en el servidor. */
export const estadoCredenciales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    meta: Boolean(process.env["META_APP_ID"] && process.env["META_APP_SECRET"]),
    tiktok: Boolean(
      process.env["TIKTOK_CLIENT_KEY"] && process.env["TIKTOK_CLIENT_SECRET"],
    ),
    scopes: { meta: SCOPES_META, tiktok: SCOPES_TIKTOK },
  }));

/** Construye la URL de autorización del proveedor para abrirla en una ventana emergente. */
export const iniciarOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProveedorInput.parse(input))
  .handler(async ({ data, context }) => {
    const request = getRequest();
    if (!request) throw new Error("La autorización debe iniciarse desde la aplicación.");
    const url = new URL(request.url);
    const host =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const origen = host ? `https://${host}` : url.origin;
    const estado = `${data.proveedor}:${context.userId}`;

    if (data.proveedor === "meta") {
      const appId = process.env["META_APP_ID"];
      if (!appId) {
        throw new Error(
          "Falta la credencial de la app de Meta (META_APP_ID). Configúrala para habilitar la autorización.",
        );
      }
      const autorizar = new URL("https://www.facebook.com/v21.0/dialog/oauth");
      autorizar.searchParams.set("client_id", appId);
      autorizar.searchParams.set("redirect_uri", `${origen}/api/public/oauth/meta/callback`);
      autorizar.searchParams.set("response_type", "code");
      autorizar.searchParams.set("scope", SCOPES_META.join(","));
      autorizar.searchParams.set("state", estado);
      return { authorizationUrl: autorizar.toString() };
    }

    const clientKey = process.env["TIKTOK_CLIENT_KEY"];
    if (!clientKey) {
      throw new Error(
        "Falta la credencial de la app de TikTok (TIKTOK_CLIENT_KEY). Configúrala para habilitar la autorización.",
      );
    }
    const autorizar = new URL("https://www.tiktok.com/v2/auth/authorize/");
    autorizar.searchParams.set("client_key", clientKey);
    autorizar.searchParams.set("redirect_uri", `${origen}/api/public/oauth/tiktok/callback`);
    autorizar.searchParams.set("response_type", "code");
    autorizar.searchParams.set("scope", SCOPES_TIKTOK.join(","));
    autorizar.searchParams.set("state", estado);
    return { authorizationUrl: autorizar.toString() };
  });

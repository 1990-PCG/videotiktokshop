import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const platformSchema = z.enum(["tiktok", "instagram"]);
const origin = () => process.env["APP_URL"] || "http://localhost:5173";

export const getSocialConnectUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ platform: platformSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const state = Buffer.from(JSON.stringify({ userId: context.userId, platform: data.platform, nonce: crypto.randomUUID() })).toString("base64url");
    if (data.platform === "tiktok") {
      const clientKey = process.env["TIKTOK_CLIENT_KEY"];
      if (!clientKey) throw new Error("TIKTOK_CLIENT_KEY não configurada.");
      const params = new URLSearchParams({ client_key: clientKey, response_type: "code", scope: "user.info.basic,video.publish,video.upload", redirect_uri: `${origin()}/oauth/tiktok/callback`, state });
      return { url: `https://www.tiktok.com/v2/auth/authorize/?${params}` };
    }
    const clientId = process.env["INSTAGRAM_APP_ID"];
    if (!clientId) throw new Error("INSTAGRAM_APP_ID não configurada.");
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: `${origin()}/oauth/instagram/callback`, response_type: "code", scope: "instagram_business_basic,instagram_business_content_publish", state });
    return { url: `https://www.instagram.com/oauth/authorize?${params}` };
  });

async function saveConnection(context: any, platform: string, token: any, metadata: any = {}) {
  const accessToken = token.access_token;
  const expiresAt = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null;
  const { error } = await context.supabase.from("social_connections").upsert({ user_id: context.userId, platform, account_id: token.open_id || metadata.id || null, account_name: metadata.username || null, access_token: accessToken, refresh_token: token.refresh_token || null, expires_at: expiresAt, scopes: String(token.scope || "").split(",").filter(Boolean), metadata }, { onConflict: "user_id,platform,account_id" });
  if (error) throw error;
  return { success: true };
}

export async function exchangeTikTokCode(code: string, state: string) {
  const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  const clientKey = process.env["TIKTOK_CLIENT_KEY"]; const clientSecret = process.env["TIKTOK_CLIENT_SECRET"];
  if (!clientKey || !clientSecret) throw new Error("Credenciais TikTok não configuradas.");
  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: `${origin()}/oauth/tiktok/callback` });
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const token = await response.json(); if (!response.ok) throw new Error(token?.error_description || "Falha no OAuth TikTok");
  return { parsed, token };
}

export async function exchangeInstagramCode(code: string, state: string) {
  const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  const clientId = process.env["INSTAGRAM_APP_ID"]; const secret = process.env["INSTAGRAM_APP_SECRET"];
  if (!clientId || !secret) throw new Error("Credenciais Instagram não configuradas.");
  const body = new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: "authorization_code", redirect_uri: `${origin()}/oauth/instagram/callback`, code });
  const response = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body });
  const token = await response.json(); if (!response.ok) throw new Error(token?.error_message || "Falha no OAuth Instagram");
  return { parsed, token };
}

export const publishToTikTok = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ exportId: z.string().uuid(), videoUrl: z.string().url(), caption: z.string().max(2200).default("") }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: connection, error } = await context.supabase.from("social_connections").select("*").eq("user_id", context.userId).eq("platform", "tiktok").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error; if (!connection) throw new Error("Conecte uma conta TikTok antes de publicar.");
    const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", { method: "POST", headers: { Authorization: `Bearer ${connection.access_token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ post_info: { title: data.caption, privacy_level: "SELF_ONLY", disable_duet: false, disable_comment: false, disable_stitch: false }, source_info: { source: "PULL_FROM_URL", video_url: data.videoUrl } }) });
    const result = await response.json(); if (!response.ok || result?.error?.code !== "ok") throw new Error(result?.error?.message || "Falha ao enviar vídeo ao TikTok.");
    const { error: insertError } = await context.supabase.from("social_publications").insert({ user_id: context.userId, export_id: data.exportId, connection_id: connection.id, platform: "tiktok", caption: data.caption, status: "processing", external_id: result.publish_id, metadata: result });
    if (insertError) throw insertError;
    return { success: true, publishId: result.publish_id };
  });

export const publishToInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ exportId: z.string().uuid(), videoUrl: z.string().url(), caption: z.string().max(2200).default("") }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: connection, error } = await context.supabase.from("social_connections").select("*").eq("user_id", context.userId).eq("platform", "instagram").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error; if (!connection?.account_id) throw new Error("Conecte uma conta Instagram profissional antes de publicar.");
    const base = `https://graph.instagram.com/${connection.account_id}`;
    const create = await fetch(`${base}/media?${new URLSearchParams({ media_type: "REELS", video_url: data.videoUrl, caption: data.caption, access_token: connection.access_token })}`, { method: "POST" });
    const container = await create.json(); if (!create.ok || !container.id) throw new Error(container?.error?.message || "Falha ao criar container do Reel.");
    const publish = await fetch(`${base}/media_publish?${new URLSearchParams({ creation_id: container.id, access_token: connection.access_token })}`, { method: "POST" });
    const result = await publish.json(); if (!publish.ok || !result.id) throw new Error(result?.error?.message || "Falha ao publicar Reel no Instagram.");
    const { error: insertError } = await context.supabase.from("social_publications").insert({ user_id: context.userId, export_id: data.exportId, connection_id: connection.id, platform: "instagram", caption: data.caption, status: "published", external_id: result.id, metadata: { container, result }, published_at: new Date().toISOString() });
    if (insertError) throw insertError;
    return { success: true, mediaId: result.id };
  });

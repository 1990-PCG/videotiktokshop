import { createFileRoute } from "@tanstack/react-router";
import { exchangeTikTokCode } from "@/lib/social.functions";

export const Route = createFileRoute("/oauth/tiktok/callback")({ component: TikTokCallback });

function TikTokCallback() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  if (typeof window !== "undefined") {
    if (error) window.setTimeout(() => window.location.replace("/dashboard/videos?social=error"), 300);
    else if (code && state) window.setTimeout(() => window.location.replace(`/dashboard/videos?social=tiktok&code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`), 300);
  }

  return <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center"><p className="text-[#D4AF37]">Conectando TikTok…</p></main>;
}

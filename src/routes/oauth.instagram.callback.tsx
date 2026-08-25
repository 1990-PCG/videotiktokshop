import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeInstagramOAuth } from "@/lib/social.functions";
import { toast } from "sonner";
export const Route=createFileRoute("/oauth/instagram/callback")({component:InstagramCallback});
function InstagramCallback(){const complete=useServerFn(completeInstagramOAuth);const p=new URLSearchParams(typeof window!=="undefined"?window.location.search:"");useEffect(()=>{const code=p.get("code"),state=p.get("state"),error=p.get("error");if(error){window.location.replace("/dashboard/social?connected=error");return;}if(code&&state){complete({data:{code,state}}).then(()=>window.location.replace("/dashboard/social?connected=instagram")).catch(e=>{console.error(e);toast.error("Não foi possível conectar o Instagram.");window.location.replace("/dashboard/social?connected=error")})}},[]);return <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center"><p className="text-[#D4AF37]">Conectando Instagram…</p></main>}

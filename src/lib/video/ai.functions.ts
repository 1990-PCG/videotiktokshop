import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  productName: z.string().min(1),
  productDescription: z.string().optional().default(""),
  script: z.string().optional().default(""),
  duration: z.number().min(5).max(180).default(20),
  style: z.enum(["ugc", "review", "problem-solution", "offer", "unboxing", "storytelling"]).default("ugc"),
  language: z.string().default("pt-BR"),
});

export const generateVideoPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const prompt = `Você é diretor de vídeos curtos para TikTok Shop e Instagram Reels. Crie um plano de edição executável para um vídeo vertical de ${data.duration}s.
Produto: ${data.productName}
Descrição: ${data.productDescription}
Roteiro: ${data.script}
Estilo: ${data.style}
Idioma: ${data.language}

Retorne SOMENTE JSON válido:
{"hook":"...","scenes":[{"start":0,"end":3,"purpose":"hook","instruction":"...","text":"..."}],"captions":[{"start":0,"end":2.5,"text":"..."}],"cta":"...","editing_notes":["..."]}
Regras: cenas curtas, cortes a cada 1-3 segundos quando fizer sentido, texto legível no safe area, CTA comercial sem alegações não comprovadas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) throw new Error(`AI Gateway error: ${response.status}`);
    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("A IA não retornou um plano.");
    try { return JSON.parse(content); } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Resposta da IA não é JSON válido.");
      return JSON.parse(match[0]);
    }
  });

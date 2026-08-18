import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const generateScripts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    productId: z.string().uuid(),
    nome: z.string(),
    categoria: z.string().optional().nullable(),
    preco: z.number().optional().nullable(),
    descricao: z.string().optional().nullable(),
  }).parse(data))
  .handler(async ({ context, data }) => {
    const prompt = `Você é especialista em roteiros de vídeo curto para TikTok Shop no Brasil.

Produto: ${data.nome}
Categoria: ${data.categoria || 'N/A'}
Preço: R$${data.preco || '0'}
Descrição: ${data.descricao || 'N/A'}

Gere 5 roteiros de vídeo DIFERENTES entre si (varie gancho, ângulo, formato e ritmo — nunca repita a mesma estrutura entre os roteiros).

Cada roteiro deve ter: hook (primeiros 2 segundos), desenvolvimento, CTA final.

Responda APENAS em JSON válido, neste formato, sem nenhum texto antes ou depois:

[{"titulo": "...", "hook": "...", "roteiro": "...", "cta": "..."}]`;

    try {
      const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env['LOVABLE_API_KEY']}`,
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          messages: [
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Gateway error: ${response.status} ${errText}`);
      }

      const aiResult = await response.json();
      const content = aiResult.choices[0].message.content;
      
      // Attempt to parse JSON from AI response
      let scripts;
      try {
        scripts = JSON.parse(content);
        // Ensure it's an array if AI wrapped it in an object
        if (!Array.isArray(scripts) && scripts.roteiros) {
          scripts = scripts.roteiros;
        }
      } catch (e) {
        // Fallback for cases where JSON might be wrapped in markdown
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          scripts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse scripts from AI response");
        }
      }

      const { data: insertedData, error: dbError } = await context.supabase
        .from("roteiros")
        .insert({
          produto_id: data.productId,
          user_id: context.userId,
          conteudo: scripts
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return { success: true, roteiroId: insertedData.id };
    } catch (error: any) {
      console.error("Error in generateScripts:", error);
      throw error;
    }
  });

export const getScriptsByProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ productId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: roteiros, error } = await context.supabase
      .from("roteiros")
      .select("*")
      .eq("produto_id", data.productId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return roteiros?.[0] || null;
  });

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
      
      let newScripts;
      try {
        newScripts = JSON.parse(content);
        if (!Array.isArray(newScripts) && newScripts.roteiros) {
          newScripts = newScripts.roteiros;
        }
      } catch (e) {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          newScripts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse scripts from AI response");
        }
      }

      // Add a unique ID to each script for individual deletion
      newScripts = newScripts.map((s: any) => ({
        ...s,
        id: crypto.randomUUID()
      }));

      // Check if scripts already exist for this product
      const { data: existing, error: fetchError } = await context.supabase
        .from("roteiros")
        .select("*")
        .eq("produto_id", data.productId)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let result;
      if (existing) {
        const updatedConteudo = [...(existing.conteudo as any[]), ...newScripts];
        const { data: updated, error: updateError } = await context.supabase
          .from("roteiros")
          .update({ conteudo: updatedConteudo })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = updated;
      } else {
        const { data: inserted, error: insertError } = await context.supabase
          .from("roteiros")
          .insert({
            produto_id: data.productId,
            user_id: context.userId,
            conteudo: newScripts
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = inserted;
      }

      return { success: true, roteiroId: result.id };
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
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw error;
    return roteiros || null;
  });

export const getAllScriptsGrouped = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("roteiros")
      .select(`
        *,
        produto:produtos(*)
      `)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count: productsCount, error: pError } = await context.supabase
      .from("produtos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId);

    if (pError) throw pError;

    const { data: roteiros, error: rError } = await context.supabase
      .from("roteiros")
      .select("conteudo")
      .eq("user_id", context.userId);

    if (rError) throw rError;

    let scriptsCount = 0;
    roteiros?.forEach((r: any) => {
      if (Array.isArray(r.conteudo)) {
        scriptsCount += r.conteudo.length;
      }
    });

    return {
      productsCount: productsCount || 0,
      scriptsCount
    };
  });

export const deleteIndividualScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ 
    roteiroRowId: z.string().uuid(),
    scriptId: z.string()
  }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: existing, error: fetchError } = await context.supabase
      .from("roteiros")
      .select("conteudo")
      .eq("id", data.roteiroRowId)
      .eq("user_id", context.userId)
      .single();

    if (fetchError) throw fetchError;

    const currentScripts = existing.conteudo as any[];
    const updatedScripts = currentScripts.filter((s: any) => s.id !== data.scriptId);

    if (updatedScripts.length === 0) {
      // If no scripts left, delete the row
      const { error: deleteError } = await context.supabase
        .from("roteiros")
        .delete()
        .eq("id", data.roteiroRowId)
        .eq("user_id", context.userId);
      
      if (deleteError) throw deleteError;
    } else {
      const { error: updateError } = await context.supabase
        .from("roteiros")
        .update({ conteudo: updatedScripts })
        .eq("id", data.roteiroRowId)
        .eq("user_id", context.userId);
      
      if (updateError) throw updateError;
    }

    return { success: true };
  });

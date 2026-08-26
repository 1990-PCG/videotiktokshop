import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "generate_scripts",
  title: "Gerar roteiros com IA",
  description:
    "Gera 5 novos roteiros de vídeo curto com IA para um produto do usuário e salva no app. Retorna os roteiros gerados.",
  inputSchema: {
    produto_id: z.string().uuid().describe("ID do produto (use list_products para descobrir)."),
    plataforma: z.string().default("TikTok").describe("Plataforma alvo: TikTok, Instagram, YouTube..."),
    publico_alvo: z.string().default("Geral").describe("Público-alvo do vídeo."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);

    const { data: produto, error: prodError } = await supabase
      .from("produtos")
      .select("id, nome, categoria, preco, descricao")
      .eq("id", input.produto_id)
      .maybeSingle();
    if (prodError) throw new ToolError(prodError.message);
    if (!produto) throw new ToolError("Produto não encontrado.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new ToolError("LOVABLE_API_KEY não configurada.");

    const prompt = `Você é especialista em roteiros de vídeo curto para ${input.plataforma} no Brasil.

Público-alvo: ${input.publico_alvo}
Produto: ${produto.nome}
Categoria: ${produto.categoria ?? "N/A"}
Preço: R$${produto.preco ?? "0"}
Descrição: ${produto.descricao ?? "N/A"}

Gere 5 roteiros DIFERENTES entre si. Cada um com hook (2s iniciais), desenvolvimento e CTA.
Responda APENAS em JSON válido: [{"titulo":"...","hook":"...","roteiro":"...","cta":"..."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }] }),
    });
    if (!response.ok) throw new ToolError(`Erro na IA: ${response.status}`);
    const json = await response.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new ToolError("A IA não retornou JSON válido.");
      parsed = JSON.parse(match[0]);
    }
    if (!Array.isArray(parsed) && Array.isArray(parsed?.roteiros)) parsed = parsed.roteiros;
    const novos = (parsed as any[]).map((s) => ({ ...s, id: crypto.randomUUID() }));

    const { data: existing, error: fetchError } = await supabase
      .from("roteiros")
      .select("id, conteudo")
      .eq("produto_id", produto.id)
      .maybeSingle();
    if (fetchError) throw new ToolError(fetchError.message);

    if (existing) {
      const atual = Array.isArray(existing.conteudo) ? (existing.conteudo as any[]) : [];
      const { error } = await supabase
        .from("roteiros")
        .update({ conteudo: [...atual, ...novos] })
        .eq("id", existing.id);
      if (error) throw new ToolError(error.message);
    } else {
      const { error } = await supabase
        .from("roteiros")
        .insert({ produto_id: produto.id, user_id: ctx.getUserId(), conteudo: novos });
      if (error) throw new ToolError(error.message);
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(novos) }],
      structuredContent: { scripts: novos },
    };
  },
});

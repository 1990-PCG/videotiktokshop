import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_product",
  title: "Criar produto",
  description: "Cadastra um novo produto do TikTok Shop para o usuário autenticado.",
  inputSchema: {
    nome: z.string().trim().min(1).describe("Nome do produto."),
    categoria: z.string().trim().optional().describe("Categoria do produto."),
    preco: z.number().nonnegative().optional().describe("Preço em reais."),
    descricao: z.string().trim().max(500).optional().describe("Descrição curta do produto."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("produtos")
      .insert({
        user_id: ctx.getUserId(),
        nome: input.nome,
        categoria: input.categoria ?? null,
        preco: input.preco ?? null,
        descricao: input.descricao ?? null,
      })
      .select("id, nome, categoria, preco, descricao")
      .single();
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: `Produto criado: ${data.nome}` }],
      structuredContent: { product: data },
    };
  },
});

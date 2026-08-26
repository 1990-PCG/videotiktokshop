import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_scripts",
  title: "Listar roteiros",
  description: "Lista os roteiros de vídeo gerados pelo usuário, opcionalmente filtrados por produto.",
  inputSchema: {
    produto_id: z.string().uuid().optional().describe("ID do produto para filtrar os roteiros."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("roteiros")
      .select("id, produto_id, conteudo, created_at, produto:produtos(nome)")
      .order("created_at", { ascending: false });
    if (input.produto_id) query = query.eq("produto_id", input.produto_id);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? []) }],
      structuredContent: { scripts: data ?? [] },
    };
  },
});

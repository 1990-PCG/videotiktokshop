import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const productSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().nullable().optional(),
  preco: z.number().nullable().optional(),
  descricao: z.string().max(500, "Descrição muito longa").nullable().optional(),
});

export const getProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("produtos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("produtos")
      .insert({
        nome: data.nome,
        categoria: data.categoria ?? null,
        preco: data.preco ?? null,
        descricao: data.descricao ?? null,
        user_id: context.userId,
      });

    if (error) throw error;
    return { success: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("produtos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw error;
    return { success: true };
  });

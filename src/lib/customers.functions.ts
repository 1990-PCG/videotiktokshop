import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const customerSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
});

export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => customerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: customer, error } = await context.supabase
      .from("clientes")
      .insert({
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        user_id: context.userId,
      })
      .select()
      .single();

    if (error) throw error;
    return customer;
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string(),
    updates: customerSchema
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: customer, error } = await context.supabase
      .from("clientes")
      .update(data.updates)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return customer;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  });

export const getCustomerHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((clienteId: unknown) => z.string().parse(clienteId))
  .handler(async ({ data: clienteId, context }) => {
    const { data, error } = await context.supabase
      .from("cliente_historico")
      .select(`
        *,
        roteiros (*)
      `)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const linkScriptToCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    clienteId: z.string(),
    roteiroId: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: entry, error } = await context.supabase
      .from("cliente_historico")
      .insert({
        cliente_id: data.clienteId,
        roteiro_id: data.roteiroId
      })
      .select()
      .single();

    if (error) throw error;
    return entry;
  });

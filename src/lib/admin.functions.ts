import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Middleware to ensure the user is an admin
const requireAdmin = async (context: any) => {
  const { data: roleData, error: roleError } = await context.supabase
    .rpc("has_role", { _user_id: context.userId, _role: "admin" });

  if (roleError || !roleData) {
    throw new Error("Unauthorized: Admin role required");
  }
  return context;
};

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Check admin role
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (!isAdmin) throw new Error("Unauthorized");

    const { count: productsCount } = await context.supabase
      .from("produtos")
      .select("*", { count: "exact", head: true });

    const { data: roteiros } = await context.supabase
      .from("roteiros")
      .select("conteudo");

    let scriptsCount = 0;
    roteiros?.forEach((r: any) => {
      if (Array.isArray(r.conteudo)) {
        scriptsCount += r.conteudo.length;
      }
    });

    const { count: usersCount } = await context.supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    return {
      productsCount: productsCount || 0,
      scriptsCount,
      usersCount: usersCount || 0
    };
  });

export const getAdminUsersStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (!isAdmin) throw new Error("Unauthorized");

    // Fetch all user roles (to get unique user list)
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("user_id, role");

    // Fetch all billing info
    const { data: billings } = await context.supabase
      .from("user_billing")
      .select("*");

    // Fetch counts from other tables
    const { data: products } = await context.supabase
      .from("produtos")
      .select("user_id");

    const { data: roteiros } = await context.supabase
      .from("roteiros")
      .select("user_id, conteudo");

    const stats = roles?.map(role => {
      const userBill = billings?.find(b => b.user_id === role.user_id);
      const userProducts = products?.filter(p => p.user_id === role.user_id) || [];
      const userRoteiros = roteiros?.filter(r => r.user_id === role.user_id) || [];
      
      let scriptsCount = 0;
      let videosCount = 0;
      let editedVideosCount = 0;

      userRoteiros.forEach(r => {
        const conteudo = r.conteudo as any;
        if (Array.isArray(conteudo)) {
          scriptsCount += conteudo.length;
          conteudo.forEach(script => {
            if (script.video_url) videosCount++;
            if (script.video_settings) editedVideosCount++;
          });
        }
      });

      return {
        userId: role.user_id,
        role: role.role,
        productsCount: userProducts.length,
        scriptsCount,
        videosCount,
        editedVideosCount,
        pagamentoEmDia: userBill?.pagamento_em_dia ?? true,
        valor: userBill?.valor ?? 0
      };
    });

    return stats || [];
  });

export const updateBilling = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    userId: z.string(),
    pagamentoEmDia: z.boolean(),
    valor: z.number()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (!isAdmin) throw new Error("Unauthorized");

    const { data: bill, error } = await context.supabase
      .from("user_billing")
      .upsert({
        user_id: data.userId,
        pagamento_em_dia: data.pagamentoEmDia,
        valor: data.valor
      })
      .select()
      .single();

    if (error) throw error;
    return bill;
  });

export const getAllDataForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (!isAdmin) throw new Error("Unauthorized");

    const { data: products } = await context.supabase
      .from("produtos")
      .select(`
        *,
        roteiros(*)
      `)
      .order("created_at", { ascending: false });

    return products;
  });

export const getProductsByUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((userId: unknown) => z.string().parse(userId))
  .handler(async ({ data: userId, context }) => {
    const { data: isAdmin } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (!isAdmin) throw new Error("Unauthorized");

    const { data: products } = await context.supabase
      .from("produtos")
      .select(`
        *,
        roteiros(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return products;
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (error) return false;
    return !!isAdmin;
  });

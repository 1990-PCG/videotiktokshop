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

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    
    if (error) return false;
    return !!isAdmin;
  });

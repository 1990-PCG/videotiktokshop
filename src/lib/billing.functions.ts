import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Retorna o status de pagamento real do usuário logado (RLS já garante que
// cada usuário só enxerga a própria linha em user_billing).
export const getMyBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_billing")
      .select("pagamento_em_dia, valor")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw error;

    // Se ainda não existe uma linha de billing para esse usuário, tratamos
    // como "em dia" por padrão (mesmo comportamento já usado no painel admin).
    return {
      pagamentoEmDia: data?.pagamento_em_dia ?? true,
      valor: data?.valor ?? 0,
    };
  });

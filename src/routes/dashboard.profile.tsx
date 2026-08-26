import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBilling } from "@/lib/billing.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, LogOut, Mail, Calendar, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const getBillingFn = useServerFn(getMyBilling);
  const { data: billing } = useQuery({
    queryKey: ["my-billing"],
    queryFn: () => getBillingFn(),
    enabled: !!user,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate({ to: "/" as any });
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" as any });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
          <User className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-[#FAFAFA] text-2xl font-light">Seu Perfil</h2>
          <p className="text-[#FAFAFA]/60 text-sm">Gerencie suas informações de conta</p>
        </div>
      </div>

      <Card className="bg-[#121212] border-[#D4AF37]/10">
        <CardHeader>
          <CardTitle className="text-[#FAFAFA] text-lg font-light">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-[#0A0A0A] border border-[#262626]">
              <Mail className="h-4 w-4 text-[#D4AF37]/60" />
            </div>
            <div>
              <p className="text-[#FAFAFA]/40 text-xs uppercase tracking-wider">E-mail</p>
              <p className="text-[#FAFAFA] font-light">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-[#0A0A0A] border border-[#262626]">
              <Calendar className="h-4 w-4 text-[#D4AF37]/60" />
            </div>
            <div>
              <p className="text-[#FAFAFA]/40 text-xs uppercase tracking-wider">Membro desde</p>
              <p className="text-[#FAFAFA] font-light">
                {new Date(user.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-[#0A0A0A] border border-[#262626]">
              {billing && !billing.pagamentoEmDia ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-[#D4AF37]/60" />
              )}
            </div>
            <div>
              <p className="text-[#FAFAFA]/40 text-xs uppercase tracking-wider">Status da Conta</p>
              <p className={billing && !billing.pagamentoEmDia ? "text-red-500 font-light" : "text-[#FAFAFA] font-light"}>
                {!billing ? "Carregando..." : billing.pagamentoEmDia ? "Ativa" : "Pagamento pendente"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-[#D4AF37]/10">
        <Button 
          variant="destructive" 
          onClick={handleLogout}
          className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all w-full sm:w-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}

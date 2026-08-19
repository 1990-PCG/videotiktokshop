import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const checkIsAdminFn = useServerFn(checkIsAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const isAdmin = await checkIsAdminFn();
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Esta conta não possui privilégios de administrador.");
        return;
      }

      toast.success("Login administrativo realizado!");
      navigate({ to: "/admin" as any });
    } catch (error: any) {
      toast.error("Erro no login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-4">
      <Card className="w-full max-w-md border-[#D4AF37]/30 bg-[#121212] shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-light text-[#D4AF37] text-center">
            Acesso Administrativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#FAFAFA]">Email Admin</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#262626] bg-[#0A0A0A] text-[#FAFAFA]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#FAFAFA]">Senha</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#262626] bg-[#0A0A0A] text-[#FAFAFA]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90"
            >
              Entrar como Admin
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => navigate({ to: "/" as any })}
              className="w-full text-[#FAFAFA]/40 hover:text-[#D4AF37]"
            >
              Voltar ao site principal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

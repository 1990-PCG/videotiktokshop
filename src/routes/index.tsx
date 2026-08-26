import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import { toast } from "sonner";

// Preserves an intended same-origin destination (e.g. the MCP OAuth consent page)
// across sign-in so the user returns there instead of the dashboard.
function safeNext(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // After an OAuth round-trip, resume the preserved destination once the session exists.
  useEffect(() => {
    const next = safeNext();
    if (!next) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = next;
    });
  }, []);



  const handleAuth = async (e: React.FormEvent, type: "login" | "signup") => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = type === "signup" 
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/dashboard` },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (type === "signup" && !data.session) {
        toast.success("Verifique seu email para confirmar o cadastro!");
        return;
      }

      toast.success(type === "signup" ? "Cadastro realizado!" : "Login realizado!");
      const next = safeNext();
      if (next) { window.location.href = next; return; }
      navigate({ to: "/dashboard" as any });
    } catch (error: any) {
      toast.error("Ocorreu um erro inesperado");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/${safeNext() ? `?next=${encodeURIComponent(safeNext()!)}` : ""}`,
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Erro ao entrar com Google");
      console.error(error);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] p-4">
      <Card className="w-full max-w-md border-[#D4AF37]/30 bg-[#121212] shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-light text-[#D4AF37] text-center">
            Roteiro TikTok Shop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#FAFAFA]">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#262626] bg-[#0A0A0A] text-[#FAFAFA]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#FAFAFA]">Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#262626] bg-[#0A0A0A] text-[#FAFAFA]"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={(e) => handleAuth(e, "login")}
                disabled={loading}
                className="flex-1 bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90"
              >
                Entrar
              </Button>
              <Button
                onClick={(e) => handleAuth(e, "signup")}
                disabled={loading}
                variant="outline"
                className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                Cadastrar
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#262626]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121212] px-2 text-[#FAFAFA]/60">Ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full border-[#262626] bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#262626]"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent, type: "login" | "signup") => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === "signup") {
        await supabase.auth.signUp({ email, password });
      } else {
        await supabase.auth.signInWithPassword({ email, password });
      }
      navigate({ to: "/dashboard" as any });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        <CardContent>
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
              <Label className="text-[#FAFAFA]">Password</Label>
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
                Login
              </Button>
              <Button
                onClick={(e) => handleAuth(e, "signup")}
                disabled={loading}
                variant="outline"
                className="flex-1 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

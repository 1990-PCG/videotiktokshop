import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScriptsByProduct } from "@/lib/roteiros.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/roteiros/$productId")({
  component: RoteirosView,
});

function RoteirosView() {
  const { productId } = useParams({ from: "/dashboard/roteiros/$productId" as any });
  const getScriptsFn = useServerFn(getScriptsByProduct);
  const navigate = useNavigate();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: roteiroData } = useSuspenseQuery({
    queryKey: ["scripts", productId],
    queryFn: () => getScriptsFn({ data: { productId } }),
  });

  if (!roteiroData) {
    return (
      <div className="text-center py-20">
        <h3 className="text-[#FAFAFA] text-xl font-light">Nenhum roteiro encontrado.</h3>
        <Button 
          onClick={() => navigate({ to: "/dashboard" as any })}
          variant="link" 
          className="text-[#D4AF37] mt-4"
        >
          Voltar para produtos
        </Button>
      </div>
    );
  }

  const scripts = roteiroData.conteudo as Array<{
    titulo: string;
    hook: string;
    roteiro: string;
    cta: string;
  }>;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Roteiro copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate({ to: "/dashboard" as any })}
          className="text-[#FAFAFA]/60 hover:text-[#FAFAFA] hover:bg-[#D4AF37]/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h2 className="text-[#D4AF37] text-2xl font-light">Roteiros Gerados</h2>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <div className="grid gap-6">
        {scripts.map((script, index) => (
          <Card key={index} className="bg-[#121212] border-[#D4AF37]/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-[#D4AF37]/5 border-b border-[#D4AF37]/10 flex flex-row items-center justify-between py-4">
              <CardTitle className="text-[#D4AF37] font-light text-lg">
                {index + 1}. {script.titulo}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`${script.hook}\n\n${script.roteiro}\n\n${script.cta}`, index)}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 text-xs">Copiar</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Gancho (0-2s)</span>
                <p className="text-[#FAFAFA] font-medium border-l-2 border-[#D4AF37] pl-3 italic">
                  "{script.hook}"
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Desenvolvimento</span>
                <p className="text-[#FAFAFA]/80 font-light leading-relaxed whitespace-pre-wrap">
                  {script.roteiro}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">CTA</span>
                <p className="text-[#FAFAFA] font-medium">
                  {script.cta}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

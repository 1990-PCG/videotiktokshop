import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAllScriptsGrouped, deleteIndividualScript, generateScripts } from "@/lib/roteiros.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Trash2, Plus, Loader2, FileText, Settings2, Download } from "lucide-react";
import { useState } from "react";
import { ScriptParamsModal } from "@/components/products/ScriptParamsModal";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/roteiros/")({
  component: RoteirosIndexView,
});

function RoteirosIndexView() {
  const queryClient = useQueryClient();
  const getGroupedScriptsFn = useServerFn(getAllScriptsGrouped);
  const deleteScriptFn = useServerFn(deleteIndividualScript);
  const generateScriptsFn = useServerFn(generateScripts);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [selectedRoteiro, setSelectedRoteiro] = useState<any>(null);

  const { data: groupedRoteiros, isLoading } = useQuery({
    queryKey: ["all-scripts"],
    queryFn: () => getGroupedScriptsFn(),
  });

  const { mutate: removeScript } = useMutation({
    mutationFn: (variables: { roteiroRowId: string; scriptId: string }) => 
      deleteScriptFn({ data: variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-scripts"] });
      toast.success("Roteiro excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleOpenParams = (roteiro: any) => {
    setSelectedRoteiro(roteiro);
    setIsParamsModalOpen(true);
  };

  const handleGenerateMore = async (params: { plataforma: string, publicoAlvo: string }) => {
    if (!selectedRoteiro) return;
    
    setGeneratingId(selectedRoteiro.id);
    try {
      await generateScriptsFn({
        data: {
          productId: selectedRoteiro.produto_id,
          nome: selectedRoteiro.produto.nome,
          categoria: selectedRoteiro.produto.categoria,
          preco: selectedRoteiro.produto.preco,
          descricao: selectedRoteiro.produto.descricao,
          plataforma: params.plataforma,
          publicoAlvo: params.publicoAlvo,
        }
      });
      queryClient.invalidateQueries({ queryKey: ["all-scripts"] });
      toast.success("Mais 5 roteiros gerados!");
      setIsParamsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao gerar roteiros.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopy = (script: any) => {
    const text = `${script.hook}\n\n${script.roteiro}\n\n${script.cta}`;
    navigator.clipboard.writeText(text);
    setCopiedId(script.id);
    toast.success("Roteiro copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTxt = (script: any) => {
    const text = `TÍTULO: ${script.titulo}\n\nHOOK: ${script.hook}\n\nROTEIRO:\n${script.roteiro}\n\nCTA: ${script.cta}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.titulo || 'roteiro'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  const handleExportCSV = (roteiro: any) => {
    if (!Array.isArray(roteiro.conteudo)) return;
    
    const headers = ["Titulo", "Hook", "Roteiro", "CTA", "Plataforma"];
    const rows = roteiro.conteudo.map((s: any) => [
      `"${(s.titulo || "").replace(/"/g, '""')}"`,
      `"${(s.hook || "").replace(/"/g, '""')}"`,
      `"${(s.roteiro || "").replace(/"/g, '""')}"`,
      `"${(s.cta || "").replace(/"/g, '""')}"`,
      `"${(roteiro.plataforma || "TikTok").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roteiros_${roteiro.produto?.nome || 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  if (isLoading) {
    return <div className="text-[#D4AF37] animate-pulse">Carregando roteiros...</div>;
  }

  if (!groupedRoteiros || groupedRoteiros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-16 w-16 text-[#D4AF37]/20 mb-6" />
        <h3 className="text-[#FAFAFA] text-xl font-light mb-2">Nenhum roteiro gerado</h3>
        <p className="text-[#FAFAFA]/60 max-w-xs">
          Vá para "Meus Produtos" e clique em "Gerar Roteiros" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-[#D4AF37] text-2xl font-light mb-8">Roteiros Gerados</h2>
      
      <Accordion type="single" collapsible className="space-y-4">
        {groupedRoteiros.map((roteiro: any) => (
          <AccordionItem 
            key={roteiro.id} 
            value={roteiro.id}
            className="border border-[#D4AF37]/20 bg-[#121212] rounded-lg px-4 md:px-6 overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-4 md:py-6">
              <div className="flex flex-col items-start text-left max-w-[80%]">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">
                  {roteiro.produto?.categoria || "Sem Categoria"}
                </span>
                <span className="text-[#FAFAFA] text-base md:text-lg font-light truncate w-full">
                  {roteiro.produto?.nome || "Produto Excluído"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 md:pb-8 pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <p className="text-[#FAFAFA]/60 text-sm">
                  {Array.isArray(roteiro.conteudo) ? roteiro.conteudo.length : 0} roteiros disponíveis
                </p>
                <Button 
                  size="sm"
                  variant="outline"
                  disabled={generatingId === roteiro.id || !roteiro.produto}
                  onClick={() => handleOpenParams(roteiro)}
                  className="w-full sm:w-auto border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  {generatingId === roteiro.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Gerar Mais 5
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportCSV(roteiro)}
                  className="w-full sm:w-auto border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>

              <div className="grid gap-6">
                {Array.isArray(roteiro.conteudo) && roteiro.conteudo.map((script: any, index: number) => (
                  <Card key={script.id || index} className="bg-[#0A0A0A] border-[#D4AF37]/10">
                    <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-[#D4AF37]/5 bg-[#D4AF37]/5">
                      <CardTitle className="text-[#D4AF37] font-light text-base">
                        {script.titulo || `Roteiro ${index + 1}`}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(script)}
                          className="text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 w-8"
                        >
                          {copiedId === script.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadTxt(script)}
                          className="text-[#D4AF37] hover:bg-[#D4AF37]/10 h-8 w-8"
                          title="Baixar .txt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Excluir este roteiro?")) {
                              removeScript({ roteiroRowId: roteiro.id, scriptId: script.id });
                            }
                          }}
                          className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40">Hook</span>
                        <p className="text-[#FAFAFA] text-sm italic font-medium border-l border-[#D4AF37]/40 pl-3">
                          "{script.hook}"
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40">Conteúdo</span>
                        <p className="text-[#FAFAFA]/70 text-sm font-light leading-relaxed whitespace-pre-wrap">
                          {script.roteiro}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40">CTA</span>
                        <p className="text-[#FAFAFA] text-sm font-medium">
                          {script.cta}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <ScriptParamsModal 
        open={isParamsModalOpen} 
        onOpenChange={setIsParamsModalOpen} 
        onConfirm={handleGenerateMore}
        isLoading={!!generatingId}
      />
    </div>
  );
}

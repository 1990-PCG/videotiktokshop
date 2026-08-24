import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Type } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchUiTextos } from "@/lib/uiText";

export function UiTextsManager() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const { data: textos, isLoading } = useQuery({
    queryKey: ["ui-textos"],
    queryFn: fetchUiTextos,
  });

  const save = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: string }) => {
      const { error } = await supabase.from("ui_textos").update({ valor }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Texto atualizado");
      queryClient.invalidateQueries({ queryKey: ["ui-textos"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível salvar"),
  });

  return (
    <Card className="bg-[#121212] border-[#D4AF37]/10">
      <CardHeader>
        <CardTitle className="text-[#FAFAFA] text-lg font-light flex items-center gap-2">
          <Type className="h-4 w-4 text-[#D4AF37]" /> Textos da interface
        </CardTitle>
        <p className="text-xs text-[#FAFAFA]/50">
          Altere os rótulos exibidos no app (editor, linha do tempo) sem mexer no código.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />}
        {(textos ?? []).map((t) => {
          const value = draft[t.id] ?? t.valor;
          const dirty = value !== t.valor;
          return (
            <div key={t.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0 space-y-1">
                <Label className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">
                  {t.descricao || t.chave}
                </Label>
                <Input
                  value={value}
                  onChange={(e) => setDraft((d) => ({ ...d, [t.id]: e.target.value }))}
                  className="bg-black border-[#262626] text-[#FAFAFA] h-9 text-sm"
                />
              </div>
              <Button
                size="sm"
                disabled={!dirty || save.isPending}
                className="h-9 bg-[#D4AF37] text-black hover:bg-[#B8962E] shrink-0"
                onClick={() => save.mutate({ id: t.id, valor: value })}
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Salvar
              </Button>
            </div>
          );
        })}
        {!isLoading && (textos ?? []).length === 0 && (
          <p className="text-sm text-[#FAFAFA]/40 italic">Nenhum texto configurável cadastrado.</p>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScriptParamsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: { plataforma: string; publicoAlvo: string }) => void;
  isLoading: boolean;
}

export function ScriptParamsModal({ open, onOpenChange, onConfirm, isLoading }: ScriptParamsModalProps) {
  const [plataforma, setPlataforma] = useState("TikTok");
  const [publicoAlvo, setPublicoAlvo] = useState("");

  const handleConfirm = () => {
    onConfirm({ plataforma, publicoAlvo: publicoAlvo || "Geral" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Personalizar Roteiro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select value={plataforma} onValueChange={setPlataforma}>
              <SelectTrigger className="bg-[#0A0A0A] border-[#D4AF37]/20">
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="YouTube">YouTube Shorts</SelectItem>
                <SelectItem value="Instagram">Instagram Reels</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Público-alvo (opcional)</Label>
            <Input 
              placeholder="Ex: Jovens, Mães, Profissionais..." 
              value={publicoAlvo}
              onChange={(e) => setPublicoAlvo(e.target.value)}
              className="bg-[#0A0A0A] border-[#D4AF37]/20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#D4AF37]/90 w-full"
          >
            {isLoading ? "Gerando..." : "Gerar Roteiros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
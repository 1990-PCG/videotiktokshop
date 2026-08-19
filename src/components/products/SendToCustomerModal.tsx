import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCustomers, linkScriptToCustomer } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendToCustomerModalProps {
  roteiroId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendToCustomerModal({ roteiroId, open, onOpenChange }: SendToCustomerModalProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const getCustomersFn = useServerFn(getCustomers);
  const linkFn = useServerFn(linkScriptToCustomer);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersFn({ data: undefined }),
  });

  const linkMutation = useMutation({
    mutationFn: (clienteId: string) => linkFn({ data: { clienteId, roteiroId } }),
    onSuccess: () => {
      toast.success("Roteiro enviado ao histórico do cliente!");
      onOpenChange(false);
      setSelectedClienteId("");
    },
    onError: () => toast.error("Erro ao vincular roteiro ao cliente."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
        <DialogHeader>
          <DialogTitle className="text-[#D4AF37]">Vincular ao Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-[#FAFAFA]/60">
            Selecione um cliente para salvar este roteiro no histórico dele.
          </p>
          <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
            <SelectTrigger className="bg-[#0A0A0A] border-[#D4AF37]/20">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
              {customers?.map((c) => (
                <SelectItem key={c.id} value={c.id} className="hover:bg-[#D4AF37]/10">
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => linkMutation.mutate(selectedClienteId)}
            disabled={!selectedClienteId || linkMutation.isPending}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80"
          >
            {linkMutation.isPending ? <Loader2 className="animate-spin" /> : "Vincular"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCustomers, createCustomer, deleteCustomer, getCustomerHistory } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Trash2, Mail, Phone, History, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/customers/")({
  component: CustomersPage,
});

function CustomersPage() {
  const queryClient = useQueryClient();
  const getCustomersFn = useServerFn(getCustomers);
  const createCustomerFn = useServerFn(createCustomer);
  const deleteCustomerFn = useServerFn(deleteCustomer);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ nome: "", email: "", telefone: "" });

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomersFn(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createCustomerFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsModalOpen(false);
      setNewCustomer({ nome: "", email: "", telefone: "" });
      toast.success("Cliente criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar cliente."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomerFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-light text-[#D4AF37]">Meus Clientes</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA]">
            <DialogHeader>
              <DialogTitle className="text-[#D4AF37]">Adicionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Nome" 
                value={newCustomer.nome} 
                onChange={(e) => setNewCustomer({...newCustomer, nome: e.target.value})}
                className="bg-[#0A0A0A] border-[#D4AF37]/20"
              />
              <Input 
                placeholder="Email" 
                type="email"
                value={newCustomer.email} 
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="bg-[#0A0A0A] border-[#D4AF37]/20"
              />
              <Input 
                placeholder="Telefone" 
                value={newCustomer.telefone} 
                onChange={(e) => setNewCustomer({...newCustomer, telefone: e.target.value})}
                className="bg-[#0A0A0A] border-[#D4AF37]/20"
              />
              <Button 
                onClick={() => createMutation.mutate(newCustomer)}
                disabled={createMutation.isPending}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80"
              >
                Salvar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers?.map((customer) => (
          <Card key={customer.id} className="bg-[#121212] border-[#D4AF37]/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[#FAFAFA] font-medium">{customer.nome}</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => deleteMutation.mutate(customer.id)}
                className="text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-center text-sm text-[#FAFAFA]/60">
                  <Mail className="mr-2 h-3 w-3 text-[#D4AF37]" /> {customer.email}
                </div>
              )}
              {customer.telefone && (
                <div className="flex items-center text-sm text-[#FAFAFA]/60">
                  <Phone className="mr-2 h-3 w-3 text-[#D4AF37]" /> {customer.telefone}
                </div>
              )}
              
              <div className="pt-4 border-t border-[#D4AF37]/10">
                <h4 className="text-xs font-semibold text-[#D4AF37] uppercase mb-2 flex items-center">
                  <History className="mr-1 h-3 w-3" /> Histórico
                </h4>
                <CustomerHistory clienteId={customer.id} />
              </div>
            </CardContent>
          </Card>
        ))}
        {customers?.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#FAFAFA]/40 font-light">
            Nenhum cliente cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerHistory({ clienteId }: { clienteId: string }) {
  const getHistoryFn = useServerFn(getCustomerHistory);
  const { data: history } = useQuery({
    queryKey: ["customer-history", clienteId],
    queryFn: () => getHistoryFn(clienteId),
  });

  if (!history || history.length === 0) {
    return <span className="text-xs text-[#FAFAFA]/30 italic">Sem envios registrados</span>;
  }

  return (
    <div className="space-y-2">
      {history.map((item: any) => (
        <div key={item.id} className="flex items-center justify-between text-xs bg-[#0A0A0A] p-2 rounded border border-[#D4AF37]/5">
          <span className="text-[#FAFAFA]/80 truncate max-w-[120px]">
            {item.roteiros?.nome || "Roteiro"}
          </span>
          <span className="text-[#FAFAFA]/40 italic">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

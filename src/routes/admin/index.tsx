import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminUsersStats, updateBilling, getProductsByUser } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Package, FileText, CheckCircle, XCircle, ChevronRight, Video, Scissors } from "lucide-react";
import { UiTextsManager } from "@/components/admin/UiTextsManager";

import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const queryClient = useQueryClient();
  const getStatsFn = useServerFn(getAdminUsersStats);
  const updateBillingFn = useServerFn(updateBilling);
  const getProductsByUserFn = useServerFn(getProductsByUser);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: () => getStatsFn({ data: undefined }),
  });

  const { data: userProducts } = useQuery({
    queryKey: ["admin-user-products", selectedUser],
    queryFn: () => getProductsByUserFn({ data: selectedUser! }),
    enabled: !!selectedUser,
  });

  const updateBillingMutation = useMutation({
    mutationFn: (data: any) => updateBillingFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] });
      toast.success("Billing atualizado com sucesso!");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-light text-[#D4AF37]">Painel Administrativo</h2>
      </div>

      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader>
          <CardTitle className="text-xl font-light text-[#D4AF37] flex items-center">
            <Users className="mr-2 h-5 w-5" /> Usuários e Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#D4AF37]/10 hover:bg-transparent">
                <TableHead className="text-[#FAFAFA]/60">ID Usuário</TableHead>
                <TableHead className="text-[#FAFAFA]/60">Produtos</TableHead>
                <TableHead className="text-[#FAFAFA]/60">Roteiros</TableHead>
                <TableHead className="text-[#FAFAFA]/60 text-center">Vídeos</TableHead>
                <TableHead className="text-[#FAFAFA]/60 text-center">Editados</TableHead>
                <TableHead className="text-[#FAFAFA]/60 text-center">Status Pagamento</TableHead>
                <TableHead className="text-[#FAFAFA]/60">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.map((user: any) => (
                <TableRow key={user.userId} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5 transition-colors">
                  <TableCell className="text-[#FAFAFA]/80 font-mono text-xs">{user.userId}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      onClick={() => setSelectedUser(user.userId)}
                      className="text-[#D4AF37] hover:text-[#D4AF37]/80 p-0 h-auto font-medium"
                    >
                      {user.productsCount} produtos <ChevronRight className="ml-1 h-3 w-3 inline" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-[#FAFAFA]/80">{user.scriptsCount}</TableCell>
                  <TableCell className="text-center text-[#FAFAFA]/80">
                    <div className="flex items-center justify-center gap-1">
                      <Video className="h-3 w-3 text-[#D4AF37]/60" /> {user.videosCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-[#FAFAFA]/80">
                    <div className="flex items-center justify-center gap-1">
                      <Scissors className="h-3 w-3 text-[#D4AF37]/60" /> {user.editedVideosCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateBillingMutation.mutate({
                        userId: user.userId,
                        pagamentoEmDia: !user.pagamentoEmDia,
                        valor: user.valor
                      })}
                      className={user.pagamentoEmDia ? "text-green-500 hover:text-green-400" : "text-red-500 hover:text-red-400"}
                    >
                      {user.pagamentoEmDia ? (
                        <CheckCircle className="h-4 w-4 mr-1 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1 inline" />
                      )}
                      {user.pagamentoEmDia ? "Em dia" : "Pendente"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-[#D4AF37]">R$</span>
                      <Input
                        type="number"
                        defaultValue={user.valor}
                        onBlur={(e) => updateBillingMutation.mutate({
                          userId: user.userId,
                          pagamentoEmDia: user.pagamentoEmDia,
                          valor: parseFloat(e.target.value) || 0
                        })}
                        className="w-24 bg-[#0A0A0A] border-[#D4AF37]/20 text-[#FAFAFA] h-8"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Products Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-[#121212] border-[#D4AF37]/20 text-[#FAFAFA] max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#D4AF37]">Produtos do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {userProducts?.map((p: any) => (
              <div key={p.id} className="p-4 rounded border border-[#D4AF37]/10 bg-[#0A0A0A]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[#FAFAFA] font-medium">{p.nome}</h3>
                    <p className="text-xs text-[#FAFAFA]/60">Criado em: {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#D4AF37] block">{p.roteiros?.length || 0} roteiros</span>
                  </div>
                </div>
                {p.roteiros?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#D4AF37]/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.roteiros.map((r: any) => {
                       const count = Array.isArray(r.conteudo) ? r.conteudo.length : 0;
                       return (
                         <div key={r.id} className="text-[10px] text-[#FAFAFA]/40 bg-[#121212] p-1 rounded">
                           {r.id.substring(0,8)}... - {count} scripts
                         </div>
                       );
                    })}
                  </div>
                )}
              </div>
            ))}
            {userProducts?.length === 0 && (
              <p className="text-center text-[#FAFAFA]/40 italic">Nenhum produto encontrado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UiTextsManager />
    </div>

  );
}

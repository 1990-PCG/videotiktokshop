import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats, getAllDataForAdmin } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, FileText } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const getStatsFn = useServerFn(getAdminStats);
  const getAllDataFn = useServerFn(getAllDataForAdmin);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getStatsFn(),
  });

  const { data: products } = useQuery({
    queryKey: ["admin-all-data"],
    queryFn: () => getAllDataFn(),
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#121212] border-[#D4AF37]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#FAFAFA]/60">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[#D4AF37]">{stats?.usersCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#121212] border-[#D4AF37]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#FAFAFA]/60">Total Produtos</CardTitle>
            <Package className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[#D4AF37]">{stats?.productsCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#121212] border-[#D4AF37]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#FAFAFA]/60">Total Roteiros</CardTitle>
            <FileText className="h-4 w-4 text-[#D4AF37]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-[#D4AF37]">{stats?.scriptsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#121212] border-[#D4AF37]/20">
        <CardHeader>
          <CardTitle className="text-xl font-light text-[#D4AF37]">Todos os Produtos e Roteiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products?.map((p: any) => (
              <div key={p.id} className="p-4 rounded border border-[#D4AF37]/10 bg-[#0A0A0A]">
                <h3 className="text-[#FAFAFA] font-medium">{p.nome}</h3>
                <p className="text-sm text-[#FAFAFA]/60">ID Produto: {p.id} | Criado em: {new Date(p.created_at).toLocaleDateString()}</p>
                <div className="mt-2 text-xs text-[#D4AF37]/80">
                  {p.roteiros?.length || 0} roteiros associados
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

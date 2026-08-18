import { createFileRoute } from "@tanstack/react-router";
import { ProductList } from "@/components/products/ProductList";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/roteiros.functions";
import { Package, FileText } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const getStatsFn = useServerFn(getDashboardStats);
  
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getStatsFn(),
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#D4AF37]/20 p-6 rounded-lg flex items-center gap-4">
          <div className="bg-[#D4AF37]/10 p-3 rounded-full">
            <Package className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[#FAFAFA]/60 text-sm font-light">Produtos Cadastrados</p>
            <p className="text-[#D4AF37] text-2xl font-medium">{stats?.productsCount ?? 0}</p>
          </div>
        </div>
        
        <div className="bg-[#121212] border border-[#D4AF37]/20 p-6 rounded-lg flex items-center gap-4">
          <div className="bg-[#D4AF37]/10 p-3 rounded-full">
            <FileText className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[#FAFAFA]/60 text-sm font-light">Roteiros Gerados</p>
            <p className="text-[#D4AF37] text-2xl font-medium">{stats?.scriptsCount ?? 0}</p>
          </div>
        </div>
      </div>

      <ProductList />
    </div>
  );
}

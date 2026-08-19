import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const checkIsAdminFn = useServerFn(checkIsAdmin);

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdminFn(),
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores");
      navigate({ to: "/dashboard" as any });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return <div className="p-8 text-[#D4AF37] animate-pulse">Verificando permissões...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-[#D4AF37]/20 pb-6">
          <h1 className="text-2xl md:text-3xl font-light text-[#D4AF37]">Painel Administrativo</h1>
          <button 
            onClick={() => navigate({ to: "/dashboard" as any })}
            className="text-sm text-[#FAFAFA]/60 hover:text-[#D4AF37] transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

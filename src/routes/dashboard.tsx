import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Package, FileText, Settings, LogOut, User, Menu, ShieldCheck, Video, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";


export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const checkIsAdminFn = useServerFn(checkIsAdmin);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdminFn(),
    enabled: !!user,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate({ to: "/" as any });
      } else {
        setUser(user);
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" as any });
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0A0A0A]">
        <Sidebar className="border-r border-[#D4AF37]/20 bg-[#121212]">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#D4AF37]/60">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate({ to: "/dashboard" as any })}
                      className="text-[#FAFAFA] hover:bg-[#D4AF37]/10"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>Meus Produtos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate({ to: "/dashboard/roteiros" as any })}
                      className="text-[#FAFAFA] hover:bg-[#D4AF37]/10"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Roteiros Gerados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate({ to: "/dashboard/videos" as any })}
                      className="text-[#FAFAFA] hover:bg-[#D4AF37]/10"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      <span>Meus Vídeos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate({ to: "/dashboard/customers" as any })}
                      className="text-[#FAFAFA] hover:bg-[#D4AF37]/10"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Clientes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => navigate({ to: "/dashboard/profile" as any })}
                      className="text-[#FAFAFA] hover:bg-[#D4AF37]/10"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => navigate({ to: "/admin" as any })}
                        className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Painel Admin</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-[#FAFAFA] hover:bg-[#D4AF37]/10">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-[#D4AF37]/20 bg-[#121212] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-[#D4AF37] hover:bg-[#D4AF37]/10 md:hidden" />
              <h1 className="text-[#D4AF37] font-light text-lg md:text-xl truncate">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-[#FAFAFA]">
                <User className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm font-light truncate max-w-[150px]">{user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10 px-2 md:px-4"
              >
                <LogOut className="md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </header>
          <div className="p-4 md:p-8">
            <Outlet />
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}

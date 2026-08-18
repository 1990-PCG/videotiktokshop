import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Package, FileText, Settings, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ProductList } from "@/components/products/ProductList";


export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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
                    <SidebarMenuButton className="text-[#FAFAFA] hover:bg-[#D4AF37]/10">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Meus Produtos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-[#FAFAFA] hover:bg-[#D4AF37]/10">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Roteiros Gerados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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

        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-[#D4AF37]/20 bg-[#121212] flex items-center justify-between px-8">
            <h1 className="text-[#D4AF37] font-light text-xl">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#FAFAFA]">
                <User className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm font-light">{user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>
          <div className="p-8">
            <ProductList />
          </div>

        </main>
      </div>
    </SidebarProvider>
  );
}

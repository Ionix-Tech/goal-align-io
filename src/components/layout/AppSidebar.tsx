import { Plus, Target, ClipboardCheck, Brain, Lightbulb, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserRole } from "@/hooks/useUserRole";

const menuItems = [
  { title: "Estratégia", url: "/strategy", icon: Target },
  { title: "Gestão e Execução", url: "/management", icon: ClipboardCheck },
  { title: "Inteligência", url: "/intelligence", icon: Brain },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { role } = useUserRole();

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-2 space-y-2">
            {(role === 'ceo' || role === 'pmo_manager') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full justify-start gap-2" size={open ? "default" : "icon"}>
                    <Plus className="h-4 w-4" />
                    {open && (
                      <>
                        <span>Novo</span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="start" className="w-56 bg-background border border-border shadow-lg z-50">
                  {role === 'ceo' && (
                    <>
                      <DropdownMenuItem asChild>
                        <NavLink to="/quick-idea" className="flex items-center gap-2 cursor-pointer">
                          <Lightbulb className="h-4 w-4" />
                          <span>Nova Ideia</span>
                        </NavLink>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <NavLink to="/create-project" className="flex items-center gap-2 cursor-pointer">
                          <Plus className="h-4 w-4" />
                          <span>Novo Projeto</span>
                        </NavLink>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {role === 'pmo_manager' && (
                    <DropdownMenuItem asChild>
                      <NavLink to="/create-project" className="flex items-center gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        <span>Novo Projeto</span>
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

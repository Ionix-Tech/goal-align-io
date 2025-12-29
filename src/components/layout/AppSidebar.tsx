import { Plus, Target, ClipboardCheck, Brain, ChevronRight, ListOrdered, FolderKanban, FileText } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { InitiativeTypeSelector } from "@/components/projects/InitiativeTypeSelector";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { FreitasLogo } from "@/components/icons/FreitasLogo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

const menuItems = [
  { 
    title: "Estratégia", 
    icon: Target,
    subitems: [
      { title: "Objetivos", url: "/theses", icon: FileText },
      { title: "Priorização", url: "/prioritization", icon: ListOrdered },
      { title: "Portfólio", url: "/portfolio", icon: FolderKanban },
    ]
  },
  { title: "Gestão e Execução", url: "/management", icon: ClipboardCheck },
  { title: "Inteligência", url: "/intelligence", icon: Brain },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { role, loading } = useUserRole();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  
  console.log('[AppSidebar] Role state:', { role, loading });
  
  if (!loading && !role) {
    console.log('[AppSidebar] No role found after loading, button will be hidden');
  }
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Estratégia": true,
  });

  const isActive = (path: string) => currentPath === path;
  
  const hasActiveSubitem = (subitems?: Array<{url: string}>) => {
    return subitems?.some(sub => isActive(sub.url)) || false;
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 p-4 border-b">
          <FreitasLogo className="h-10 w-10" />
          {open && (
            <div>
              <h2 className="text-xl font-bold text-foreground">
                COMPASS
              </h2>
              <p className="text-xs text-muted-foreground">Freitas Portfolio</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-2 space-y-2">
            {loading ? (
              <Button className="w-full justify-start gap-2" size={open ? "default" : "icon"} disabled>
                <Plus className="h-4 w-4 animate-pulse" />
                {open && <span className="animate-pulse">Carregando...</span>}
              </Button>
            ) : role ? (
              <Button 
                className="w-full justify-start gap-2" 
                size={open ? "default" : "icon"}
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="h-4 w-4" />
                {open && <span>Novo</span>}
              </Button>
            ) : null}
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.subitems) {
                  const sectionOpen = openSections[item.title];
                  const hasActive = hasActiveSubitem(item.subitems);
                  
                  return (
                    <Collapsible
                      key={item.title}
                      open={sectionOpen}
                      onOpenChange={() => toggleSection(item.title)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={hasActive ? "font-semibold" : ""}>
                            <item.icon className="h-4 w-4" />
                            {open && (
                              <>
                                <span>{item.title}</span>
                                <ChevronRight 
                                  className={`h-4 w-4 ml-auto transition-transform ${sectionOpen ? 'rotate-90' : ''}`} 
                                />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenu className="ml-4 border-l pl-2">
                            {item.subitems.map((subitem) => (
                              <SidebarMenuItem key={subitem.title}>
                                <SidebarMenuButton asChild isActive={isActive(subitem.url)}>
                                  <NavLink to={subitem.url}>
                                    <subitem.icon className="h-4 w-4" />
                                    {open && <span>{subitem.title}</span>}
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.url ? isActive(item.url) : false}>
                      <NavLink to={item.url || "#"}>
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <InitiativeTypeSelector 
        open={showTypeSelector} 
        onClose={() => setShowTypeSelector(false)} 
      />
    </Sidebar>
  );
}

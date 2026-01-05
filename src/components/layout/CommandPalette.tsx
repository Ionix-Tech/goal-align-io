import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ListChecks,
  Target,
  BarChart3,
  Brain,
  Trophy,
  Settings,
  Lightbulb,
  FileText,
  FolderOpen,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navigationCommands = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ListChecks, label: "Priorização", path: "/prioritization" },
  { icon: Target, label: "Gestão", path: "/management" },
  { icon: BarChart3, label: "Portfólio", path: "/portfolio" },
  { icon: Brain, label: "Inteligência", path: "/intelligence" },
  { icon: Trophy, label: "Objetivos Estratégicos", path: "/theses" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const quickActions = [
  { icon: Lightbulb, label: "Nova ideia rápida", path: "/quick-idea" },
  { icon: FileText, label: "Novo projeto A3", path: "/create-a3" },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const navigate = useNavigate();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const { data: recentProjects } = useQuery({
    queryKey: ["recent-projects-command"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, initiative_type")
        .neq("initiative_type", "idea")
        .order("updated_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: open,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, projetos ou ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.path}
              onSelect={() => runCommand(() => navigate(cmd.path))}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          {quickActions.map((action) => (
            <CommandItem
              key={action.path}
              onSelect={() => runCommand(() => navigate(action.path))}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {recentProjects && recentProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projetos Recentes">
              {recentProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => runCommand(() => navigate(`/project/${project.id}`))}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span>{project.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Search className="w-3 h-3" />
      <span>Buscar...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}

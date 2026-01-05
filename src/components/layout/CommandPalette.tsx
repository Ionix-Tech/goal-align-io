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
  CheckSquare,
  Flag,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "@/hooks/useDebounce";

const navigationGroups = [
  {
    heading: "Estratégia",
    items: [
      { icon: Trophy, label: "Objetivos", path: "/theses" },
      { icon: ListChecks, label: "Priorização", path: "/prioritization" },
      { icon: BarChart3, label: "Portfólio", path: "/portfolio" },
    ],
  },
  {
    heading: "Operacional",
    items: [
      { icon: Target, label: "Gestão e Execução", path: "/management" },
      { icon: Brain, label: "Inteligência", path: "/intelligence" },
    ],
  },
  {
    heading: "Sistema",
    items: [
      { icon: Settings, label: "Configurações", path: "/settings" },
    ],
  },
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
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const navigate = useNavigate();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const isSearching = debouncedSearch.length >= 2;

  // Projetos recentes (sempre visíveis)
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

  // Busca de projetos
  const { data: searchProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects-search-command", debouncedSearch],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, initiative_type")
        .neq("initiative_type", "idea")
        .ilike("name", `%${debouncedSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: open && isSearching,
  });

  // Busca de tarefas
  const { data: searchTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks-search-command", debouncedSearch],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_tasks")
        .select("id, title, project_id, projects(name)")
        .ilike("title", `%${debouncedSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: open && isSearching,
  });

  // Busca de marcos
  const { data: searchMilestones, isLoading: loadingMilestones } = useQuery({
    queryKey: ["milestones-search-command", debouncedSearch],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_milestones")
        .select("id, title, project_id, projects(name)")
        .ilike("title", `%${debouncedSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: open && isSearching,
  });

  // Busca de indicadores
  const { data: searchIndicators, isLoading: loadingIndicators } = useQuery({
    queryKey: ["indicators-search-command", debouncedSearch],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_indicators")
        .select("id, name, project_id, projects(name)")
        .ilike("name", `%${debouncedSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: open && isSearching,
  });

  // Busca de teses/objetivos
  const { data: searchTheses, isLoading: loadingTheses } = useQuery({
    queryKey: ["theses-search-command", debouncedSearch],
    queryFn: async () => {
      const { data } = await supabase
        .from("strategic_theses")
        .select("id, name")
        .ilike("name", `%${debouncedSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: open && isSearching,
  });

  const isLoadingSearch = loadingProjects || loadingTasks || loadingMilestones || loadingIndicators || loadingTheses;

  const hasSearchResults = 
    (searchProjects && searchProjects.length > 0) ||
    (searchTasks && searchTasks.length > 0) ||
    (searchMilestones && searchMilestones.length > 0) ||
    (searchIndicators && searchIndicators.length > 0) ||
    (searchTheses && searchTheses.length > 0);

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

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Buscar projetos, tarefas, marcos, indicadores..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoadingSearch ? "Buscando..." : "Nenhum resultado encontrado."}
        </CommandEmpty>
        
        {/* Resultados da busca */}
        {isSearching && (
          <>
            {searchProjects && searchProjects.length > 0 && (
              <CommandGroup heading="Projetos">
                {searchProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(`/management/${project.id}`))}
                  >
                    <FolderOpen className="mr-2 h-4 w-4 text-primary" />
                    <span>{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchTasks && searchTasks.length > 0 && (
              <CommandGroup heading="Tarefas">
                {searchTasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => runCommand(() => navigate(`/management/${task.project_id}`))}
                  >
                    <CheckSquare className="mr-2 h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span>{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {(task.projects as { name: string } | null)?.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchMilestones && searchMilestones.length > 0 && (
              <CommandGroup heading="Marcos">
                {searchMilestones.map((milestone) => (
                  <CommandItem
                    key={milestone.id}
                    onSelect={() => runCommand(() => navigate(`/management/${milestone.project_id}`))}
                  >
                    <Flag className="mr-2 h-4 w-4 text-orange-500" />
                    <div className="flex flex-col">
                      <span>{milestone.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {(milestone.projects as { name: string } | null)?.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchIndicators && searchIndicators.length > 0 && (
              <CommandGroup heading="Indicadores">
                {searchIndicators.map((indicator) => (
                  <CommandItem
                    key={indicator.id}
                    onSelect={() => runCommand(() => navigate(`/management/${indicator.project_id}`))}
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                    <div className="flex flex-col">
                      <span>{indicator.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(indicator.projects as { name: string } | null)?.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchTheses && searchTheses.length > 0 && (
              <CommandGroup heading="Objetivos Estratégicos">
                {searchTheses.map((thesis) => (
                  <CommandItem
                    key={thesis.id}
                    onSelect={() => runCommand(() => navigate(`/theses/${thesis.id}`))}
                  >
                    <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                    <span>{thesis.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoadingSearch && !hasSearchResults && debouncedSearch.length >= 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado para "{debouncedSearch}"
              </div>
            )}
          </>
        )}

        {/* Navegação e ações (quando não está buscando) */}
        {!isSearching && (
          <>
            {navigationGroups.map((group, idx) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.items.map((cmd) => (
                  <CommandItem
                    key={cmd.path}
                    onSelect={() => runCommand(() => navigate(cmd.path))}
                  >
                    <cmd.icon className="mr-2 h-4 w-4" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

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
                      onSelect={() => runCommand(() => navigate(`/management/${project.id}`))}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>{project.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
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

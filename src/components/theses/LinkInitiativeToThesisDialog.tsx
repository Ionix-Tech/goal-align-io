import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Lightbulb, Briefcase, ClipboardList, Link2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUnlinkedProjects, type UnlinkedProject } from "@/hooks/useUnlinkedProjects";

interface LinkInitiativeToThesisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thesisId: string;
  thesisName: string;
  defaultTab?: 'idea' | 'project' | 'action_plan';
}

const typeConfig = {
  idea: {
    icon: Lightbulb,
    label: 'Ideias',
    singularLabel: 'ideia',
    color: 'text-yellow-500',
  },
  project: {
    icon: Briefcase,
    label: 'Projetos',
    singularLabel: 'projeto',
    color: 'text-blue-500',
  },
  action_plan: {
    icon: ClipboardList,
    label: 'Planos de Ação',
    singularLabel: 'plano de ação',
    color: 'text-purple-500',
  },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  idea: { label: 'Ideia', variant: 'secondary' },
  draft: { label: 'Rascunho', variant: 'outline' },
  review: { label: 'Em Revisão', variant: 'default' },
  approved: { label: 'Aprovado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'secondary' },
  completed: { label: 'Concluído', variant: 'default' },
};

export function LinkInitiativeToThesisDialog({
  open,
  onOpenChange,
  thesisId,
  thesisName,
  defaultTab = 'idea',
}: LinkInitiativeToThesisDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const queryClient = useQueryClient();
  
  const { data: unlinkedData, isLoading } = useUnlinkedProjects();

  const linkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ thesis_id: thesisId })
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis-projects", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-projects"] });
      toast.success("Iniciativa vinculada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao vincular iniciativa");
    },
  });

  const getFilteredItems = (type: 'idea' | 'project' | 'action_plan') => {
    if (!unlinkedData) return [];
    
    const items = type === 'idea' 
      ? unlinkedData.ideas 
      : type === 'project' 
        ? unlinkedData.projects 
        : unlinkedData.actionPlans;

    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderInitiativeList = (type: 'idea' | 'project' | 'action_plan') => {
    const items = getFilteredItems(type);
    const config = typeConfig[type];
    const Icon = config.icon;

    if (isLoading) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Carregando...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="py-8 text-center border-2 border-dashed rounded-lg">
          <Icon className={`h-8 w-8 mx-auto mb-2 ${config.color} opacity-50`} />
          <p className="text-muted-foreground text-sm">
            {searchTerm 
              ? `Nenhum(a) ${config.singularLabel} encontrado(a)`
              : `Nenhum(a) ${config.singularLabel} disponível para vincular`
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <InitiativeItem
            key={item.id}
            item={item}
            type={type}
            onLink={() => linkMutation.mutate(item.id)}
            isLinking={linkMutation.isPending}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vincular a {thesisName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="idea" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Ideias ({unlinkedData?.ideas.length || 0})
              </TabsTrigger>
              <TabsTrigger value="project" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Projetos ({unlinkedData?.projects.length || 0})
              </TabsTrigger>
              <TabsTrigger value="action_plan" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Planos ({unlinkedData?.actionPlans.length || 0})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="idea" className="mt-0">
                {renderInitiativeList('idea')}
              </TabsContent>
              <TabsContent value="project" className="mt-0">
                {renderInitiativeList('project')}
              </TabsContent>
              <TabsContent value="action_plan" className="mt-0">
                {renderInitiativeList('action_plan')}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Subcomponent for each initiative item
function InitiativeItem({
  item,
  type,
  onLink,
  isLinking,
}: {
  item: UnlinkedProject;
  type: 'idea' | 'project' | 'action_plan';
  onLink: () => void;
  isLinking: boolean;
}) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const statusConfig = statusLabels[item.status] || statusLabels.draft;

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.color}`} />
      
      {/* Content - takes remaining space */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium truncate">{item.name}</p>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </div>

      {/* Actions - fixed width, never shrinks */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={statusConfig.variant} className="whitespace-nowrap text-xs">
          {statusConfig.label}
        </Badge>

        {item.assigned_to_profile && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={item.assigned_to_profile.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {item.assigned_to_profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onLink}
          disabled={isLinking}
          className="gap-1 flex-shrink-0"
        >
          <Link2 className="h-3 w-3" />
          Vincular
        </Button>
      </div>
    </div>
  );
}

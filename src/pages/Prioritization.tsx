import { useState } from "react";
import { Target, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { useProjects } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import type { Database } from "@/integrations/supabase/types";

type StrategicPillar = Database['public']['Enums']['strategic_pillar'];

const Prioritization = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<StrategicPillar | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  const { role } = useUserRole();
  
  const filters = {
    search,
    strategic_pillar: selectedPillar || undefined
  };
  
  const { data, isLoading } = useProjects(filters);
  const projectsByStatus = data?.byStatus || {
    idea: [],
    draft: [],
    review: [],
    approved: [],
    archived: []
  };
  const allProjects = data?.all || [];

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
    // TODO: Open project details modal
  };

  // Calculate stats
  const stats = {
    ideas: projectsByStatus.idea?.length || 0,
    drafts: projectsByStatus.draft?.length || 0,
    review: projectsByStatus.review?.length || 0,
    approved: projectsByStatus.approved?.length || 0,
    archived: projectsByStatus.archived?.length || 0
  };

  return (
    <div className="p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Priorização</h1>
              <p className="text-muted-foreground">
                Priorize e gerencie ideias e projetos estratégicos
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                💡 Ideias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ideas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📝 Detalhamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drafts}</div>
            </CardContent>
          </Card>

          <Card className={role === 'ceo' && stats.review > 0 ? "ring-2 ring-orange-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ⏳ Em Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.review}</div>
              {role === 'ceo' && stats.review > 0 && (
                <p className="text-xs text-orange-600 mt-1">Aguardando sua aprovação</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ✅ Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📦 Arquivados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          selectedPillar={selectedPillar}
          onPillarChange={setSelectedPillar}
        />

        {/* View Toggle and Content */}
        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando projetos...
              </div>
            ) : (
              <KanbanBoard 
                projectsByStatus={projectsByStatus}
                onProjectClick={handleProjectClick}
              />
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              Visualização em lista em desenvolvimento...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Prioritization;

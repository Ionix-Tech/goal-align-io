import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [selectedThesis, setSelectedThesis] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<Database['public']['Enums']['initiative_type'] | null>(null);

  const { role } = useUserRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Limpar parâmetros de URL inválidos
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== 'kanban' && tabParam !== 'list') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Garantir que apenas valores válidos sejam aceitos
  const handleViewChange = (v: string) => {
    if (v === 'kanban' || v === 'list') {
      setView(v as 'kanban' | 'list');
    } else {
      setView('kanban'); // fallback seguro
    }
  };
  
  const filters = {
    search,
    strategic_pillar: selectedPillar || undefined,
    initiative_type: selectedType || undefined
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
    navigate(`/projects/${project.id}`);
  };

  // Calculate stats with type separation
  const stats = {
    ideas: projectsByStatus.idea?.length || 0,
    drafts_projects: projectsByStatus.draft?.filter(p => p.initiative_type === 'project').length || 0,
    drafts_plans: projectsByStatus.draft?.filter(p => p.initiative_type === 'action_plan').length || 0,
    review_projects: projectsByStatus.review?.filter(p => p.initiative_type === 'project').length || 0,
    review_plans: projectsByStatus.review?.filter(p => p.initiative_type === 'action_plan').length || 0,
    approved_projects: projectsByStatus.approved?.filter(p => p.initiative_type === 'project').length || 0,
    approved_plans: projectsByStatus.approved?.filter(p => p.initiative_type === 'action_plan').length || 0,
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
              <div className="text-2xl font-bold">{stats.drafts_projects + stats.drafts_plans}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.drafts_projects} projetos · {stats.drafts_plans} planos
              </div>
            </CardContent>
          </Card>

          <Card className={role === 'ceo' && (stats.review_projects + stats.review_plans) > 0 ? "ring-2 ring-orange-500" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ⏳ Em Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.review_projects + stats.review_plans}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.review_projects} projetos · {stats.review_plans} planos
              </div>
              {role === 'ceo' && (stats.review_projects + stats.review_plans) > 0 && (
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
              <div className="text-2xl font-bold">{stats.approved_projects + stats.approved_plans}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.approved_projects} projetos · {stats.approved_plans} planos
              </div>
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
          selectedThesis={selectedThesis}
          onThesisChange={setSelectedThesis}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* View Toggle and Content */}
        <Tabs value={view} onValueChange={handleViewChange} defaultValue="kanban">
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

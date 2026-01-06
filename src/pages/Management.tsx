import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2, Filter, FileText, Target, Heart, Brain, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProjectExecutionCard } from "@/components/management/ProjectExecutionCard";
import { ManagementChatPanel } from "@/components/chat/ManagementChatPanel";
import { useApprovedProjects } from "@/hooks/useApprovedProjects";
import { useTheses } from "@/hooks/useTheses";

type HealthStatus = 'green' | 'yellow' | 'red';

// Configuração visual dos pilares baseada no nome
const getPillarIcon = (name: string) => {
  const upper = name.toUpperCase();
  if (upper.includes('ALMA')) return <Heart className="h-4 w-4 text-rose-600" />;
  if (upper.includes('MENTE')) return <Brain className="h-4 w-4 text-violet-600" />;
  if (upper.includes('CORPO')) return <Zap className="h-4 w-4 text-green-600" />;
  return <Target className="h-4 w-4 text-primary" />;
};

const Management = () => {
  const navigate = useNavigate();
  const [selectedThesisId, setSelectedThesisId] = useState<string | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<HealthStatus | 'all'>('all');

  const { data: theses } = useTheses({ includeArchived: false });
  const { data: projects, isLoading } = useApprovedProjects(selectedThesisId);

  // Filter by health status
  const filteredProjects = (projects || []).filter(p => {
    const healthMatch = selectedHealth === 'all' || p.current_health === selectedHealth;
    return healthMatch;
  });

  // Calculate stats
  const stats = {
    total: projects?.length || 0,
    projects: projects?.filter(p => p.initiative_type === 'project').length || 0,
    green: projects?.filter(p => p.current_health === 'green').length || 0,
    yellow: projects?.filter(p => p.current_health === 'yellow').length || 0,
    red: projects?.filter(p => p.current_health === 'red').length || 0,
    noStatus: projects?.filter(p => !p.current_health).length || 0
  };

  // Prepare context for AI chat
  const chatProjectsSummary = useMemo(() => ({
    total: stats.total,
    healthy: stats.green,
    attention: stats.yellow,
    critical: stats.red,
    noStatus: stats.noStatus,
  }), [stats]);

  const chatProjects = useMemo(() => 
    (projects || []).map(p => ({
      id: p.id,
      name: p.name,
      health: p.current_health,
      progress: p.milestones_total > 0
        ? Math.round((p.milestones_completed / p.milestones_total) * 100)
        : 0,
      pendingTasks: undefined,
      assignee: p.assigned_to_profile?.full_name || null,
    })),
  [projects]);

  // Group theses by type for better organization
  const activeTheses = (theses || []).filter(t => t.is_active);

  return (
    <div className="p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestão e Execução</h1>
              <p className="text-muted-foreground">
                Acompanhe e gerencie projetos em andamento
              </p>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="ring-2 ring-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-600" />
                Projetos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.projects}</div>
            </CardContent>
          </Card>

          <Card className="ring-2 ring-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                Saudáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.green}</div>
            </CardContent>
          </Card>

          <Card className="ring-2 ring-yellow-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.yellow}</div>
            </CardContent>
          </Card>

          <Card className="ring-2 ring-red-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                Críticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.red}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.noStatus}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />

              <Select
                value={selectedThesisId || 'all'}
                onValueChange={(value) => setSelectedThesisId(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Todos os objetivos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      Todos os objetivos estratégicos
                    </div>
                  </SelectItem>
                  {activeTheses.map((thesis) => (
                    <SelectItem key={thesis.id} value={thesis.id}>
                      <div className="flex items-center gap-2">
                        {getPillarIcon(thesis.name)}
                        <span className="truncate max-w-[200px]">{thesis.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {activeTheses.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum objetivo estratégico ativo
                    </div>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={selectedHealth}
                onValueChange={(value) => setSelectedHealth(value as HealthStatus | 'all')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="green">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      Saudáveis
                    </div>
                  </SelectItem>
                  <SelectItem value="yellow">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      Atenção
                    </div>
                  </SelectItem>
                  <SelectItem value="red">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      Críticos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {(selectedThesisId || selectedHealth !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedThesisId(null);
                    setSelectedHealth('all');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando projetos...
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Nenhum projeto aprovado encontrado</p>
                <p className="text-sm mt-2">
                  {selectedThesisId || selectedHealth !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Aprove projetos na tela de Priorização para vê-los aqui'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectExecutionCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/management/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Chat */}
      <ManagementChatPanel
        contextType="management"
        projectsSummary={chatProjectsSummary}
        projects={chatProjects}
      />
    </div>
  );
};

export default Management;

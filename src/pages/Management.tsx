import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2, Filter, Database as DatabaseIcon, FileText, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProjectExecutionCard } from "@/components/management/ProjectExecutionCard";
import { useApprovedProjects } from "@/hooks/useApprovedProjects";
import type { Database } from "@/integrations/supabase/types";

type StrategicPillar = Database['public']['Enums']['strategic_pillar'];
type HealthStatus = 'green' | 'yellow' | 'red';
type InitiativeType = 'project' | 'action_plan';

const Management = () => {
  const navigate = useNavigate();
  const [selectedPillar, setSelectedPillar] = useState<StrategicPillar | null>(null);
  const [selectedHealth, setSelectedHealth] = useState<HealthStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<InitiativeType | 'all'>('all');
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);

  const { data: projects, isLoading } = useApprovedProjects(selectedPillar);

  const handleGenerateTestData = async () => {
    setIsGeneratingTestData(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-test-data');
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message || 'Projeto de teste criado com sucesso!');
        // Refresh the page to show the new project
        window.location.reload();
      } else {
        throw new Error(data.error || 'Erro ao criar projeto de teste');
      }
    } catch (error) {
      console.error('Error generating test data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao criar projeto de teste: ' + errorMessage);
    } finally {
      setIsGeneratingTestData(false);
    }
  };

  // Filter by health status and initiative type
  const filteredProjects = (projects || []).filter(p => {
    const healthMatch = selectedHealth === 'all' || p.current_health === selectedHealth;
    const typeMatch = selectedType === 'all' || p.initiative_type === selectedType;
    return healthMatch && typeMatch;
  });

  // Calculate stats
  const stats = {
    total: projects?.length || 0,
    projects: projects?.filter(p => p.initiative_type === 'project').length || 0,
    actionPlans: projects?.filter(p => p.initiative_type === 'action_plan').length || 0,
    green: projects?.filter(p => p.current_health === 'green').length || 0,
    yellow: projects?.filter(p => p.current_health === 'yellow').length || 0,
    red: projects?.filter(p => p.current_health === 'red').length || 0,
    noStatus: projects?.filter(p => !p.current_health).length || 0
  };

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
                Acompanhe e gerencie projetos e planos de ação em andamento
              </p>
            </div>
          </div>
          
          {import.meta.env.DEV && (
            <Button
              onClick={handleGenerateTestData}
              disabled={isGeneratingTestData}
              variant="outline"
              size="sm"
            >
              <DatabaseIcon className="h-4 w-4 mr-2" />
              {isGeneratingTestData ? 'Gerando...' : 'Gerar Projeto A3 de Teste'}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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

          <Card className="ring-2 ring-violet-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-3 w-3 text-violet-600" />
                Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-700">{stats.actionPlans}</div>
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
                value={selectedPillar || 'all'}
                onValueChange={(value) => setSelectedPillar(value === 'all' ? null : value as StrategicPillar)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os pilares" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pilares</SelectItem>
                  <SelectItem value="operational_efficiency">⚙️ Eficiência Operacional</SelectItem>
                  <SelectItem value="sales_expansion">📈 Expansão de Vendas</SelectItem>
                  <SelectItem value="new_business">🚀 Novos Negócios</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as InitiativeType | 'all')}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-blue-600" />
                      Projetos
                    </div>
                  </SelectItem>
                  <SelectItem value="action_plan">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-3 w-3 text-violet-600" />
                      Planos de Ação
                    </div>
                  </SelectItem>
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

              {(selectedPillar || selectedHealth !== 'all' || selectedType !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPillar(null);
                    setSelectedHealth('all');
                    setSelectedType('all');
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
                <p className="text-lg font-medium">Nenhuma iniciativa aprovada encontrada</p>
                <p className="text-sm mt-2">
                  {selectedPillar || selectedHealth !== 'all' || selectedType !== 'all'
                    ? 'Tente ajustar os filtros'
                    : 'Aprove projetos ou planos de ação na tela de Priorização para vê-los aqui'}
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
    </div>
  );
};

export default Management;

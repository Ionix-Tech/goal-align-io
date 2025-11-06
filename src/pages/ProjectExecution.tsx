import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { HealthStatusBadge } from "@/components/management/HealthStatusBadge";

const strategicPillars = [
  { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
  { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
  { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
];

const ProjectExecution = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProjectDetails(projectId || null);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando projeto...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Projeto não encontrado</p>
      </div>
    );
  }

  const pillarConfig = project.strategic_pillar
    ? strategicPillars.find(p => p.value === project.strategic_pillar)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/management')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <HealthStatusBadge status={null} size="md" showLabel />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">✅ Aprovado</Badge>
                  {pillarConfig && (
                    <Badge variant="outline">
                      <span className="mr-1">{pillarConfig.icon}</span>
                      {pillarConfig.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📋 Visão Geral</TabsTrigger>
            <TabsTrigger value="thesis">📄 Tese do Projeto</TabsTrigger>
            <TabsTrigger value="progress">📊 Progresso</TabsTrigger>
            <TabsTrigger value="updates">🔄 Atualizações</TabsTrigger>
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {project.milestones.filter(m => m.completed).length}/{project.milestones.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">concluídos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Indicadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.indicators.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">em acompanhamento</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Membros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{project.members.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">no time</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gestor Responsável</p>
                  <p className="text-base mt-1">
                    {project.assignee?.full_name || 'Não atribuído'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Criado por</p>
                  <p className="text-base mt-1">{project.creator?.full_name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Aprovação</p>
                  <p className="text-base mt-1">
                    {project.approved_at
                      ? new Date(project.approved_at).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Tese do Projeto */}
          <TabsContent value="thesis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tese Original do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Contexto</h3>
                  <p className="text-sm whitespace-pre-wrap">{project.context || 'Sem contexto'}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Objetivo</h3>
                  <p className="text-sm whitespace-pre-wrap">{project.objective || 'Sem objetivo'}</p>
                </div>

                <Separator />

                {project.description && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Ideia Original</h3>
                      <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Indicadores Definidos</h3>
                  <div className="space-y-3">
                    {project.indicators.map((ind, index) => (
                      <Card key={ind.id}>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-2">Indicador {index + 1}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs font-medium">Estado Atual: </span>
                              <span className="text-sm">{ind.current_state}</span>
                            </div>
                            <div>
                              <span className="text-xs font-medium">Meta: </span>
                              <span className="text-sm">{ind.target_state}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Milestones Planejados</h3>
                  <div className="space-y-2">
                    {project.milestones.map((ms) => (
                      <Card key={ms.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{ms.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(ms.target_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Progresso */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento de Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Esta funcionalidade permite atualizar o progresso de milestones e indicadores.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em desenvolvimento: Formulários para atualizar milestones e indicadores.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Atualizações */}
          <TabsContent value="updates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atualizações Semanais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Registre atualizações semanais sobre desafios, iniciativas, resultados e blockers.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em desenvolvimento: Formulário de updates semanais e histórico.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectExecution;

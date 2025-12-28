import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { HealthStatusBadge } from "@/components/management/HealthStatusBadge";
import { MilestoneTimeline } from "@/components/execution/MilestoneTimeline";
import { IndicatorCards } from "@/components/execution/IndicatorCards";
import { AddMilestoneUpdateDialog } from "@/components/execution/AddMilestoneUpdateDialog";
import { MilestoneHistoryDialog } from "@/components/execution/MilestoneHistoryDialog";
import { MilestoneDateHistoryDialog } from "@/components/execution/MilestoneDateHistoryDialog";
import { AddIndicatorMeasurementDialog } from "@/components/execution/AddIndicatorMeasurementDialog";
import { IndicatorHistoryDialog } from "@/components/execution/IndicatorHistoryDialog";
import { AddMilestoneDialog } from "@/components/execution/AddMilestoneDialog";
import { AddIndicatorDialog } from "@/components/execution/AddIndicatorDialog";
import { TaskManagementPanel } from "@/components/execution/TaskManagementPanel";
import { IndicatorEvolutionChart } from "@/components/execution/IndicatorEvolutionChart";
import { SituationManagement } from "@/components/execution/SituationManagement";
import { useProjectSituations } from "@/hooks/useProjectSituations";
import { useA3ReportData } from "@/hooks/useA3ReportData";
import { PrintableA3Report } from "@/components/execution/PrintableA3Report";
import { ProjectAttachmentsCard } from "@/components/execution/ProjectAttachmentsCard";
import { LinkedIdeasCard } from "@/components/execution/LinkedIdeasCard";
import { GanttChart } from "@/components/execution/GanttChart";
import { Target, FileCheck, AlertCircle } from "lucide-react";

const strategicPillars = [
  { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
  { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
  { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
];

const ProjectExecution = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProjectDetails(projectId || null);
  const { data: situations } = useProjectSituations(projectId || null);
  const { data: reportData } = useA3ReportData(projectId || null);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [showMilestoneUpdateDialog, setShowMilestoneUpdateDialog] = useState(false);
  const [showMilestoneHistoryDialog, setShowMilestoneHistoryDialog] = useState(false);
  const [showMilestoneDateHistoryDialog, setShowMilestoneDateHistoryDialog] = useState(false);
  const [showIndicatorMeasurementDialog, setShowIndicatorMeasurementDialog] = useState(false);
  const [showIndicatorHistoryDialog, setShowIndicatorHistoryDialog] = useState(false);
  const [showAddMilestoneDialog, setShowAddMilestoneDialog] = useState(false);
  const [showAddIndicatorDialog, setShowAddIndicatorDialog] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<{ id: string; title: string; progress: number } | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<{ id: string; name: string; targetValue?: string; unit?: string | null } | null>(null);

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

  const handleExportReport = () => {
    window.print();
  };

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
                  <Badge variant="default">Projeto</Badge>
                  {project.source_idea && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Originado de: {project.source_idea.name}
                    </Badge>
                  )}
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
            
            <Button
              variant="default"
              size="sm"
              onClick={handleExportReport}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar Relatório A3
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">📄 Capa</TabsTrigger>
            <TabsTrigger value="thesis">📄 Objetivo do Projeto</TabsTrigger>
            <TabsTrigger value="indicators">📊 Indicadores</TabsTrigger>
            <TabsTrigger value="gantt">
              <BarChart3 className="h-4 w-4 mr-1" />
              Gantt
            </TabsTrigger>
            <TabsTrigger value="progress">🎯 Milestones</TabsTrigger>
            <TabsTrigger value="updates">🔄 Atividades</TabsTrigger>
          </TabsList>

          {/* Aba: Capa */}
          <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <CardTitle className="text-sm font-medium">Membros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{project.members.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">no time</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Objetivo do Projeto */}
                {project.objective && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Objetivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {project.objective}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Situações Atual vs Situação Alvo */}
                {situations && situations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Situação Atual vs Situação Alvo
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Problemas identificados e metas correspondentes que o projeto deve alcançar
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {situations.map((situation, index) => (
                          <div key={situation.id} className="space-y-3">
                            {index > 0 && <Separator className="my-4" />}
                            
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Situação Atual */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                  <h4 className="font-semibold text-sm">Situação Atual / Problema</h4>
                                </div>
                                <p className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                  {situation.current_problem}
                                </p>
                              </div>

                              {/* Situação Alvo */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  <h4 className="font-semibold text-sm">Situação Alvo / Meta</h4>
                                </div>
                                <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-900/30">
                                  {situation.target_goal}
                                </p>
                              </div>
                            </div>

                            {/* Indicadores da situação (se existirem) */}
                            {situation.indicators && situation.indicators.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Indicadores vinculados ({situation.indicators.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {situation.indicators.map((ind: any) => (
                                    <Badge key={ind.id} variant="outline" className="text-xs">
                                      {ind.name}: {ind.current_value} → {ind.target_value} {ind.unit}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Requisitos */}
                {project.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        Requisitos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {project.requirements}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <ProjectAttachmentsCard projectId={projectId!} />

                {/* Ideias de Origem */}
                <LinkedIdeasCard projectId={projectId!} />

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

          {/* Aba: Indicadores */}
          <TabsContent value="indicators" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Indicadores de Desempenho</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe as métricas e evolução do projeto
                </p>
              </div>
              <Button onClick={() => setShowAddIndicatorDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Indicador
              </Button>
            </div>

            <IndicatorCards
              indicators={project.indicators.map(ind => ({
                id: ind.id,
                name: ind.name,
                current_state: ind.current_state,
                target_state: ind.target_state,
                unit: ind.unit,
                progress: ind.progress ?? 0,
                trend: ind.trend,
                lastUpdate: ind.lastUpdate ?? null
              }))}
              onUpdateIndicator={(indicatorId) => {
                const indicator = project.indicators.find(i => i.id === indicatorId);
                if (indicator) {
                  setSelectedIndicator({
                    id: indicator.id,
                    name: indicator.name,
                    unit: indicator.unit
                  });
                  setShowIndicatorMeasurementDialog(true);
                }
              }}
              onViewHistory={(indicatorId) => {
                const indicator = project.indicators.find(i => i.id === indicatorId);
                if (indicator) {
                  setSelectedIndicator({
                    id: indicator.id,
                    name: indicator.name,
                    targetValue: indicator.target_state,
                    unit: indicator.unit
                  });
                  setShowIndicatorHistoryDialog(true);
                }
              }}
            />
          </TabsContent>

          {/* Aba: Objetivo do Projeto */}
          <TabsContent value="thesis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Objetivo Original do Projeto
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

          {/* Aba: Gantt */}
          <TabsContent value="gantt" className="space-y-6">
            <GanttChart 
              projectId={project.id}
              onTaskClick={(taskId) => {
                // Navega para a aba de atualizações onde as tarefas são gerenciadas
                setActiveTab('updates');
              }}
            />
          </TabsContent>

          {/* Aba: Milestones */}
          <TabsContent value="progress" className="space-y-6">
            {/* Milestones Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Timeline de Milestones</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {project.milestones.filter(m => m.completed).length} de {project.milestones.length} concluídos
                  </Badge>
                  <Button size="sm" onClick={() => setShowAddMilestoneDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Milestone
                  </Button>
                </div>
              </div>
              <MilestoneTimeline
                milestones={project.milestones}
                onUpdateMilestone={(milestoneId) => {
                  const milestone = project.milestones.find(m => m.id === milestoneId);
                  if (milestone) {
                    setSelectedMilestone({ id: milestone.id, title: milestone.title, progress: milestone.progress || 0 });
                    setShowMilestoneUpdateDialog(true);
                  }
                }}
                onViewHistory={(milestoneId) => {
                  const milestone = project.milestones.find(m => m.id === milestoneId);
                  if (milestone) {
                    setSelectedMilestone({ id: milestone.id, title: milestone.title, progress: milestone.progress || 0 });
                    setShowMilestoneHistoryDialog(true);
                  }
                }}
                onViewDateHistory={(milestoneId) => {
                  const milestone = project.milestones.find(m => m.id === milestoneId);
                  if (milestone) {
                    setSelectedMilestone({ id: milestone.id, title: milestone.title, progress: milestone.progress || 0 });
                    setShowMilestoneDateHistoryDialog(true);
                  }
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            <TaskManagementPanel
              projectId={project.id}
              milestones={project.milestones.map(m => ({ id: m.id, title: m.title }))}
              indicators={project.indicators.map(i => ({ id: i.id, name: i.name }))}
              members={project.members.map(m => ({ user_id: m.user.id, user: { full_name: m.user.full_name } }))}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedMilestone && (
        <>
          <AddMilestoneUpdateDialog
            open={showMilestoneUpdateDialog}
            onOpenChange={setShowMilestoneUpdateDialog}
            milestoneId={selectedMilestone.id}
            milestoneTitle={selectedMilestone.title}
            currentProgress={selectedMilestone.progress}
          />
          <MilestoneHistoryDialog
            open={showMilestoneHistoryDialog}
            onOpenChange={setShowMilestoneHistoryDialog}
            milestoneId={selectedMilestone.id}
            milestoneTitle={selectedMilestone.title}
          />
          <MilestoneDateHistoryDialog
            open={showMilestoneDateHistoryDialog}
            onOpenChange={setShowMilestoneDateHistoryDialog}
            milestoneId={selectedMilestone.id}
            milestoneTitle={selectedMilestone.title}
          />
        </>
      )}

      {selectedIndicator && (
        <>
          <AddIndicatorMeasurementDialog
            open={showIndicatorMeasurementDialog}
            onOpenChange={setShowIndicatorMeasurementDialog}
            indicatorId={selectedIndicator.id}
            indicatorName={selectedIndicator.name}
            unit={selectedIndicator.unit}
            projectId={projectId!}
          />
          <IndicatorHistoryDialog
            open={showIndicatorHistoryDialog}
            onOpenChange={setShowIndicatorHistoryDialog}
            indicatorId={selectedIndicator.id}
            indicatorName={selectedIndicator.name}
            targetValue={selectedIndicator.targetValue}
            unit={selectedIndicator.unit}
          />
        </>
      )}

      <AddMilestoneDialog
        open={showAddMilestoneDialog}
        onOpenChange={setShowAddMilestoneDialog}
        projectId={project.id}
      />

      <AddIndicatorDialog
        open={showAddIndicatorDialog}
        onOpenChange={setShowAddIndicatorDialog}
        projectId={project.id}
      />

      {/* Relatório A3 para impressão (oculto na tela) */}
      <PrintableA3Report
        project={project}
        milestones={project.milestones}
        indicators={project.indicators}
        situations={situations}
        reportData={reportData}
      />
    </div>
  );
};

export default ProjectExecution;

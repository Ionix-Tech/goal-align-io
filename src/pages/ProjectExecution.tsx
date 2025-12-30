import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useRequirements } from "@/hooks/useRequirements";
import { HealthStatusBadge } from "@/components/management/HealthStatusBadge";
import { MilestoneTimeline } from "@/components/execution/MilestoneTimeline";
import { MilestoneTracker } from "@/components/execution/MilestoneTracker";
import { ProjectCoverSection } from "@/components/execution/ProjectCoverSection";
import { ActivitySection } from "@/components/execution/ActivitySection";
import { IndicatorCards } from "@/components/execution/IndicatorCards";
import { AddMilestoneUpdateDialog } from "@/components/execution/AddMilestoneUpdateDialog";
import { MilestoneHistoryDialog } from "@/components/execution/MilestoneHistoryDialog";
import { MilestoneDateHistoryDialog } from "@/components/execution/MilestoneDateHistoryDialog";
import { AddIndicatorMeasurementDialog } from "@/components/execution/AddIndicatorMeasurementDialog";
import { IndicatorHistoryDialog } from "@/components/execution/IndicatorHistoryDialog";
import { AddMilestoneDialog } from "@/components/execution/AddMilestoneDialog";
import { AddIndicatorDialog } from "@/components/execution/AddIndicatorDialog";
import { AddRequirementDialog } from "@/components/execution/AddRequirementDialog";
import { EditRequirementsDialog } from "@/components/execution/EditRequirementsDialog";
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
  const { data: requirements } = useRequirements(projectId || null);
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
  const [showAddRequirementDialog, setShowAddRequirementDialog] = useState(false);
  const [showEditRequirementsDialog, setShowEditRequirementsDialog] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<{ id: string; title: string; progress: number } | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<{ id: string; name: string; targetValue?: string; unit?: string | null } | null>(null);

  // Helper to generate next requirement code
  const getNextRequirementCode = () => {
    if (!requirements || requirements.length === 0) return "R1";
    const maxNumber = requirements.reduce((max, req) => {
      const match = req.code.match(/R(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    return `R${maxNumber + 1}`;
  };

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
            {/* Milestone Tracker no topo */}
            <MilestoneTracker milestones={project.milestones} />
            
            {/* Seção: Visão do Projeto */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Visão do Projeto
              </h2>
              <ProjectCoverSection
                project={project}
                requirements={requirements || []}
                situations={situations || []}
                onAddRequirement={() => setShowAddRequirementDialog(true)}
                onEditRequirements={() => setShowEditRequirementsDialog(true)}
              />
            </div>

            {/* Seção: Atividade */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Atividade
              </h2>
              <ActivitySection projectId={projectId!} />
            </div>
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

      <AddRequirementDialog
        open={showAddRequirementDialog}
        onOpenChange={setShowAddRequirementDialog}
        projectId={project.id}
        nextCode={getNextRequirementCode()}
        nextDisplayOrder={(requirements?.length || 0) + 1}
      />

      <EditRequirementsDialog
        open={showEditRequirementsDialog}
        onOpenChange={setShowEditRequirementsDialog}
        projectId={project.id}
        requirements={requirements || []}
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

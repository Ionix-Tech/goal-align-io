import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Lightbulb, LayoutGrid, BarChart3, Columns, Flame } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useRequirements } from "@/hooks/useRequirements";
import { useDeleteMilestone } from "@/hooks/useMilestones";
import { useProjectTasks } from "@/hooks/useProjectTasks";
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
import { A3PresentationView } from "@/components/execution/A3PresentationView";
import { ProjectAttachmentsCard } from "@/components/execution/ProjectAttachmentsCard";
import { LinkedIdeasCard } from "@/components/execution/LinkedIdeasCard";
import { GanttChart } from "@/components/execution/GanttChart";
import { ProjectKanban } from "@/components/execution/ProjectKanban";
import { ManagementChatPanel } from "@/components/chat/ManagementChatPanel";
import { Target, FileCheck, AlertCircle, Monitor } from "lucide-react";
import { format } from "date-fns";
import { ActionMatrix } from "@/components/execution/ActionMatrix";

const strategicPillars = [
  { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
  { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
  { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
];

const ProjectExecution = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: project, isLoading } = useProjectDetails(projectId || null);
  const { data: situations } = useProjectSituations(projectId || null);
  const { data: requirements } = useRequirements(projectId || null);
  const { data: reportData } = useA3ReportData(projectId || null);
  const { data: tasks } = useProjectTasks(projectId || null);
  const deleteMilestone = useDeleteMilestone();

  // Get initial tab from URL parameter
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return 'overview';

    const validTabs = ['overview', 'thesis', 'progress', 'indicators', 'matrix', 'visualization', 'updates'];
    if (validTabs.includes(tabParam)) return tabParam;

    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

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
  const [showPresentationView, setShowPresentationView] = useState(false);

  const [selectedMilestone, setSelectedMilestone] = useState<{ id: string; title: string; progress: number } | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<{ id: string; name: string; targetValue?: string; unit?: string | null } | null>(null);

  // Prepare context for AI chat - must be before any conditional returns
  const chatProjectDetails = useMemo(() => {
    if (!project || !tasks) return null;
    
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // Get unique team members from tasks
    const memberMap = new Map<string, string>();
    tasks.forEach(t => {
      if (t.assigned_to && t.assignee?.full_name) {
        memberMap.set(t.assigned_to, t.assignee.full_name);
      }
    });
    const members = Array.from(memberMap.entries()).map(([id, name]) => ({ id, name }));
    
    // Get assignee name from project
    const assigneeName = project.assignee?.full_name;
    
    return {
      name: project.name,
      objective: project.objective || undefined,
      health: undefined,
      milestones: project.milestones.map(m => ({
        title: m.title,
        targetDate: m.target_date ? format(new Date(m.target_date), 'dd/MM/yyyy') : 'Não definido',
        completed: m.completed,
        type: m.milestone_type || undefined,
      })),
      indicators: project.indicators.map(i => ({
        name: i.name,
        current: i.current_state,
        target: i.target_state,
        unit: i.unit || undefined,
      })),
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : undefined,
        assigneeName: t.assignee?.full_name,
      })),
      pendingActions: pendingTasks.length,
      completedActions: completedTasks.length,
      assignee: assigneeName,
      members,
    };
  }, [project, tasks]);

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
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Projeto não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  const pillarConfig = project.strategic_pillar
    ? strategicPillars.find(p => p.value === project.strategic_pillar)
    : null;

  const handleExportReport = () => {
    window.print();
  };

  return (
    <AppLayout
      customBreadcrumbs={[
        { label: "Gestão e Execução", href: "/management" },
        { label: project.name }
      ]}
    >
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
                  {project.is_critical && (
                    <Badge variant="destructive" className="gap-1">
                      <Flame className="h-3 w-3" />
                      Crítico
                    </Badge>
                  )}
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowPresentationView(true)}
              >
                <Monitor className="mr-2 h-4 w-4" />
                Apresentar A3
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
              >
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-7`}>
            <TabsTrigger value="overview">📄 Capa</TabsTrigger>
            {project.initiative_type !== 'idea' && (
              <TabsTrigger value="thesis">📄 Objetivo</TabsTrigger>
            )}
            <TabsTrigger value="progress">🎯 Milestones</TabsTrigger>
            <TabsTrigger value="indicators">📊 Indicadores</TabsTrigger>
            <TabsTrigger value="action-matrix">📋 Matriz</TabsTrigger>
            <TabsTrigger value="visualization">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Visualização
            </TabsTrigger>
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
                thesis={project.thesis}
                linkedKPI={project.linkedKPI}
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
              <ActivitySection 
                projectId={projectId!}
                requirements={requirements || []}
                milestones={project.milestones.map(m => ({ id: m.id, title: m.title, milestone_type: m.milestone_type }))}
                indicators={project.indicators.map(i => ({ id: i.id, name: i.name }))}
              />
            </div>
          </TabsContent>

          {/* Aba: Indicadores */}
          <TabsContent value="indicators" className="space-y-6">
            {/* Seção 1: Indicador Estratégico */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 Indicador Estratégico
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Vinculado à tese estratégica
                </p>
              </CardHeader>
              <CardContent>
                {project.thesis && project.linkedKPI ? (
                  <div className="space-y-4">
                    <Badge variant="secondary">{project.thesis.name}</Badge>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-base">{project.linkedKPI.name}</h4>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Atual</p>
                          <p className="text-lg font-bold text-primary">
                            {project.linkedKPI.current_value ?? '--'}
                            {project.linkedKPI.unit && <span className="text-sm ml-1">{project.linkedKPI.unit}</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Meta</p>
                          <p className="text-lg font-bold">
                            {project.linkedKPI.target_value}
                            {project.linkedKPI.unit && <span className="text-sm ml-1">{project.linkedKPI.unit}</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progresso</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, 
                                    project.linkedKPI.current_value && project.linkedKPI.target_value 
                                      ? (project.linkedKPI.current_value / project.linkedKPI.target_value) * 100 
                                      : 0
                                  ))}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              {project.linkedKPI.current_value && project.linkedKPI.target_value 
                                ? Math.round((project.linkedKPI.current_value / project.linkedKPI.target_value) * 100)
                                : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Este projeto não está vinculado a um indicador estratégico
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Seção 2: Indicadores do Projeto */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Indicadores do Projeto</h3>
                <p className="text-sm text-muted-foreground">
                  Métricas específicas para acompanhar este projeto
                </p>
              </div>
              <Button onClick={() => setShowAddIndicatorDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Indicador
              </Button>
            </div>

            {/* CHG-15: Strategic KPI mirror (read-only) */}
            {project.thesis_kpi && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">KPI Estratégico (espelho do objetivo)</span>
                  <Badge variant="outline" className="text-xs">Somente leitura</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Nome</p>
                    <p className="font-medium">{project.thesis_kpi.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Atual</p>
                    <p className="font-medium">{project.thesis_kpi.current_value ?? '—'} {project.thesis_kpi.unit || ''}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Meta</p>
                    <p className="font-medium">{project.thesis_kpi.target_value ?? '—'} {project.thesis_kpi.unit || ''}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* CHG-17: Informational text about automatic metrics */}
            <Card className="p-4 bg-muted/50 border-dashed">
              <div className="flex gap-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p><strong>Acurácia:</strong> % de ações concluídas dentro do prazo definido.</p>
                  <p><strong>Eficiência:</strong> impacto das ações realizadas na evolução dos KPIs definidos.</p>
                </div>
              </div>
            </Card>

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

          {/* Aba: Objetivo do Projeto - Detalhamento A3 */}
          <TabsContent value="thesis" className="space-y-4">
            {/* 1. Contexto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  Contexto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">📌 Nome:</span>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">🎯 Objetivo Estratégico:</span>
                    <p className="font-medium">{project.thesis?.name || 'Não vinculado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">📊 Indicador Macro:</span>
                    <p className="font-medium">{project.linkedKPI?.name?.replace(/\t/g, ' ') || 'Não definido'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">👤 Líder:</span>
                    <p className="font-medium">{project.assignee?.full_name || project.creator?.full_name || '--'}</p>
                  </div>
                </div>
                {project.members.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">👥 Equipe:</span>
                    <p className="font-medium">{project.members.map(m => m.user.full_name).join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Requisitos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  Requisitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requirements && requirements.length > 0 ? (
                  <div className="space-y-2">
                    {requirements.map((req) => (
                      <div key={req.id} className="flex gap-3 text-sm border-b border-border/50 pb-2 last:border-0">
                        <span className="font-mono font-semibold text-primary min-w-[40px]">{req.code}</span>
                        <span>{req.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum requisito definido</p>
                )}
              </CardContent>
            </Card>

            {/* 3. Situação Atual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  Situação Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Situação Atual:</span>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {project.current_situation_description 
                      || (situations && situations.length > 0 
                          ? situations.map(s => s.current_problem).join('\n\n')
                          : 'Não descrita')}
                  </p>
                </div>
                {project.attachments && project.attachments.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">📎 Anexos: </span>
                    <span className="text-sm">{project.attachments.length} arquivo(s)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Situação Alvo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                  Situação Alvo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Situação Alvo:</span>
                  <p className="text-sm whitespace-pre-wrap mt-1">
                    {project.target_situation_description 
                      || (situations && situations.length > 0 
                          ? situations.map(s => s.target_goal).join('\n\n')
                          : 'Não descrita')}
                  </p>
                </div>
                {project.indicators.length > 0 && (
                  <div className="mt-4">
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Indicador</th>
                            <th className="text-center p-2 font-medium">Atual</th>
                            <th className="text-center p-2 font-medium">Meta</th>
                            <th className="text-center p-2 font-medium">Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.indicators.map((ind) => (
                            <tr key={ind.id} className="border-t">
                              <td className="p-2">{ind.name}</td>
                              <td className="p-2 text-center">{ind.current_state}</td>
                              <td className="p-2 text-center">{ind.target_state}</td>
                              <td className="p-2 text-center text-muted-foreground">{ind.unit || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Execução */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                  Execução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">Ações Planejadas:</span>
                {project.tasks && project.tasks.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{task.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          {task.due_date && (
                            <span>📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                          )}
                          {task.assigned_to_name && (
                            <span>👤 {task.assigned_to_name}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Nenhuma ação planejada</p>
                )}
              </CardContent>
            </Card>

            {/* 6. Controle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</span>
                  Controle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <span className="text-sm text-muted-foreground">Milestones:</span>
                {project.milestones.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {project.milestones
                      .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
                      .map((ms) => {
                        const typeIcon = ms.milestone_type === 'decolagem' ? '🚀' : ms.milestone_type === 'voo' ? '✈️' : ms.milestone_type === 'escala' ? '🌍' : '📌';
                        return (
                          <div key={ms.id} className="flex items-center justify-between text-sm">
                            <span>
                              {typeIcon} {ms.title}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(ms.target_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum milestone definido</p>
                )}
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data de Aprovação:</span>
                  <span className="font-medium">
                    {project.approved_at 
                      ? new Date(project.approved_at).toLocaleDateString('pt-BR')
                      : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Visualização (Gantt + Kanban) */}
          <TabsContent value="visualization" className="space-y-6">
            <Tabs defaultValue="gantt" className="w-full">
              <TabsList>
                <TabsTrigger value="gantt">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Gantt
                </TabsTrigger>
                <TabsTrigger value="kanban">
                  <Columns className="h-4 w-4 mr-1" />
                  Kanban
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="gantt" className="mt-4">
                <GanttChart 
                  projectId={project.id}
                  onTaskClick={(taskId) => {
                    setActiveTab('updates');
                  }}
                />
              </TabsContent>
              
              <TabsContent value="kanban" className="mt-4">
                <ProjectKanban projectId={project.id} />
              </TabsContent>
            </Tabs>
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
                onDeleteMilestone={(milestoneId) => {
                  deleteMilestone.mutate({ milestoneId, projectId: project.id });
                }}
              />
            </div>
          </TabsContent>

          {/* CHG-22: Action Matrix */}
          <TabsContent value="action-matrix" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Matriz de Ações</h3>
              <p className="text-sm text-muted-foreground">
                Visualize as ações do projeto agrupadas por data ou responsável
              </p>
            </div>
            <ActionMatrix tasks={tasks || []} />
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            <TaskManagementPanel
              projectId={project.id}
              milestones={project.milestones.map(m => ({ id: m.id, title: m.title }))}
              indicators={project.indicators.map(i => ({ id: i.id, name: i.name }))}
              members={(() => {
                const list = project.members.map(m => ({ user_id: m.user.id, user: { full_name: m.user.full_name } }));
                // Include project leader if not already in the members list
                if (project.assignee && !list.some(m => m.user_id === project.assignee!.id)) {
                  list.unshift({ user_id: project.assignee.id, user: { full_name: project.assignee.full_name } });
                }
                return list;
              })()}
              requirements={requirements || []}
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

      {/* Apresentação A3 fullscreen */}
      <A3PresentationView
        open={showPresentationView}
        onOpenChange={setShowPresentationView}
        project={project}
        situations={situations || []}
      />

      {/* Relatório A3 para impressão (oculto na tela) */}
      <PrintableA3Report
        project={project}
        milestones={project.milestones}
        indicators={project.indicators}
        situations={situations}
        reportData={reportData}
      />

      {/* AI Chat */}
      <ManagementChatPanel
        contextType="execution"
        projectDetails={chatProjectDetails}
      />
      </div>
    </AppLayout>
  );
};

export default ProjectExecution;

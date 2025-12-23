import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, Users, Save, Send, CheckCircle2, XCircle, AlertCircle, Archive, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useProjectTransitions } from "@/hooks/useProjectTransitions";
import { ProjectComments } from "./ProjectComments";
import { getInitiativeLabels } from "@/config/initiativeLabels";

interface Indicator {
  id: string;
  currentState: string;
  targetState: string;
}

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
}

interface SituationIndicator {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  unit: string;
}

interface Situation {
  id: string;
  currentProblem: string;
  targetGoal: string;
  indicators: SituationIndicator[];
  attachments: File[];
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface ProjectDrawerProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProjectDrawer({ projectId, isOpen, onClose, onSuccess }: ProjectDrawerProps) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProjectDetails(projectId);
  const { transition, isTransitioning } = useProjectTransitions();

  const [projectName, setProjectName] = useState("");
  const [context, setContext] = useState("");
  const [strategicPillar, setStrategicPillar] = useState("");
  const [objective, setObjective] = useState("");
  const [requirements, setRequirements] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'idea' | 'detail'>('detail');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const strategicPillars = [
    { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
    { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
    { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
  ];

  // Buscar membros disponíveis
  useEffect(() => {
    const fetchMembers = async () => {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'project_member');

      if (rolesData && rolesData.length > 0) {
        const memberIds = rolesData.map(r => r.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', memberIds);

        setAvailableMembers(profilesData || []);
      }
    };

    fetchMembers();
  }, []);

  // Carregar dados do projeto quando abrir
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setContext(project.context || '');
      setStrategicPillar(project.strategic_pillar || '');
      setObjective(project.objective || '');
      setRequirements(project.requirements || '');
      
      setIndicators(project.indicators.map(ind => ({
        id: ind.id,
        currentState: ind.current_state,
        targetState: ind.target_state
      })));
      
      setMilestones(project.milestones.map(ms => ({
        id: ms.id,
        title: ms.title,
        targetDate: ms.target_date
      })));
      
      setSelectedMembers(project.members.map(m => m.user.id));
      
      // Carregar situações do projeto
      if (projectId) {
        loadSituations(projectId);
      }
    }
  }, [project, projectId]);

  // Resetar estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setNewComment("");
    }
  }, [isOpen]);

  const addIndicator = () => {
    setIndicators([...indicators, {
      id: crypto.randomUUID(),
      currentState: "",
      targetState: "",
    }]);
  };

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter(ind => ind.id !== id));
  };

  const updateIndicator = (id: string, field: keyof Indicator, value: string) => {
    setIndicators(indicators.map(ind =>
      ind.id === id ? { ...ind, [field]: value } : ind
    ));
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      id: crypto.randomUUID(),
      title: "",
      targetDate: "",
    }]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(ms => ms.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(ms =>
      ms.id === id ? { ...ms, [field]: value } : ms
    ));
  };

  const handleAddMember = (memberId: string) => {
    if (!selectedMembers.includes(memberId)) {
      setSelectedMembers([...selectedMembers, memberId]);
    }
    setMembersPopoverOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(id => id !== memberId));
  };

  const loadSituations = async (projId: string) => {
    const { data: situationsData } = await supabase
      .from('project_situations')
      .select(`
        id,
        current_problem,
        target_goal,
        situation_indicators (
          id,
          name,
          current_value,
          target_value,
          unit
        )
      `)
      .eq('project_id', projId)
      .order('display_order');

    if (situationsData) {
      setSituations(situationsData.map((s: any) => ({
        id: s.id,
        currentProblem: s.current_problem,
        targetGoal: s.target_goal,
        indicators: (s.situation_indicators || []).map((ind: any) => ({
          id: ind.id,
          name: ind.name,
          currentValue: String(ind.current_value),
          targetValue: String(ind.target_value),
          unit: ind.unit || ''
        })),
        attachments: []
      })));
    }
  };

  const addSituation = () => {
    setSituations([...situations, {
      id: crypto.randomUUID(),
      currentProblem: "",
      targetGoal: "",
      indicators: [],
      attachments: []
    }]);
  };

  const removeSituation = (id: string) => {
    setSituations(situations.filter(s => s.id !== id));
  };

  const updateSituation = (id: string, field: keyof Situation, value: any) => {
    setSituations(situations.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addIndicatorToSituation = (situationId: string) => {
    const newIndicator: SituationIndicator = {
      id: crypto.randomUUID(),
      name: "",
      currentValue: "",
      targetValue: "",
      unit: ""
    };
    setSituations(situations.map(s => 
      s.id === situationId ? { ...s, indicators: [...s.indicators, newIndicator] } : s
    ));
  };

  const removeIndicatorFromSituation = (situationId: string, indicatorId: string) => {
    setSituations(situations.map(s => 
      s.id === situationId 
        ? { ...s, indicators: s.indicators.filter(ind => ind.id !== indicatorId) } 
        : s
    ));
  };

  const updateIndicatorInSituation = (
    situationId: string, 
    indicatorId: string, 
    field: keyof SituationIndicator, 
    value: string
  ) => {
    setSituations(situations.map(s => 
      s.id === situationId 
        ? { 
            ...s, 
            indicators: s.indicators.map(ind => 
              ind.id === indicatorId ? { ...ind, [field]: value } : ind
            ) 
          }
        : s
    ));
  };

  const addAttachmentsToSituation = (situationId: string, files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`Arquivo ${file.name} excede o tamanho máximo de 50MB`);
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Tipo de arquivo ${file.name} não permitido`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSituations(situations.map(s => 
        s.id === situationId 
          ? { ...s, attachments: [...s.attachments, ...validFiles] } 
          : s
      ));
      toast.success(`${validFiles.length} arquivo(s) adicionado(s)`);
    }
  };

  const removeAttachmentFromSituation = (situationId: string, index: number) => {
    setSituations(situations.map(s => 
      s.id === situationId 
        ? { ...s, attachments: s.attachments.filter((_, i) => i !== index) } 
        : s
    ));
  };

  const handleSave = async (targetStatus: 'draft' | 'review') => {
    if (!project || !projectId) return;

    const isActionPlan = project.initiative_type === 'action_plan';
    const labels = getInitiativeLabels(project.initiative_type);

    // Validações básicas
    if (!projectName.trim()) {
      toast.error(`Nome ${labels.article === 'o' ? 'do' : 'da'} ${labels.singular.toLowerCase()} é obrigatório`);
      return;
    }

    // Validações para Projeto
    if (!isActionPlan && !context.trim()) {
      toast.error("Contexto é obrigatório");
      return;
    }

    // Validações para envio para aprovação
    if (targetStatus === 'review') {
      if (isActionPlan) {
        // Validações para Plano de Ação - campos 5W2H básicos
        // O plano pode ser aprovado com menos requisitos
      } else {
        // Validações para Projeto
        if (!strategicPillar) {
          toast.error("Objetivo estratégico é obrigatório");
          return;
        }
        if (!objective.trim()) {
          toast.error("Objetivo é obrigatório");
          return;
        }
        if (indicators.length === 0) {
          toast.error("Adicione pelo menos 1 indicador");
          return;
        }
        if (milestones.length === 0) {
          toast.error("Adicione pelo menos 1 milestone");
          return;
        }
      }
    }

    setSaving(true);

    try {
      // 1. Atualizar projeto
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: projectName,
          context: context,
          requirements: requirements || null,
          strategic_pillar: (strategicPillar || null) as 'operational_efficiency' | 'sales_expansion' | 'new_business' | null,
          objective: objective || null,
          status: targetStatus,
          submitted_for_review_at: targetStatus === 'review' ? new Date().toISOString() : project.submitted_for_review_at
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // 2. Atualizar indicadores
      await supabase.from('project_indicators').delete().eq('project_id', projectId);
      
      if (indicators.length > 0) {
        const { error: indicatorsError } = await supabase
          .from('project_indicators')
          .insert(indicators.map(ind => ({
            project_id: projectId,
            current_state: ind.currentState,
            target_state: ind.targetState
          })));

        if (indicatorsError) throw indicatorsError;
      }

      // 3. Atualizar milestones
      await supabase.from('project_milestones').delete().eq('project_id', projectId);
      
      if (milestones.length > 0) {
        const { error: milestonesError } = await supabase
          .from('project_milestones')
          .insert(milestones.map(ms => ({
            project_id: projectId,
            title: ms.title,
            target_date: ms.targetDate
          })));

        if (milestonesError) throw milestonesError;
      }

      // 4. Atualizar membros
      await supabase.from('project_members').delete().eq('project_id', projectId);
      
      if (selectedMembers.length > 0) {
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(selectedMembers.map(memberId => ({
            project_id: projectId,
            user_id: memberId,
            added_by: user?.id
          })));

        if (membersError) throw membersError;
      }

      // 5. Atualizar situações
      await supabase.from('project_situations').delete().eq('project_id', projectId);
      
      if (situations.length > 0) {
        for (let i = 0; i < situations.length; i++) {
          const situation = situations[i];
          
          const { data: situationData, error: situationError } = await supabase
            .from('project_situations')
            .insert({
              project_id: projectId,
              current_problem: situation.currentProblem,
              target_goal: situation.targetGoal,
              display_order: i,
              created_by: user?.id
            } as any)
            .select()
            .single();

          if (situationError) throw situationError;

          // Salvar indicadores da situação
          if (situation.indicators.length > 0) {
            const { error: situationIndicatorsError } = await supabase
              .from('situation_indicators')
              .insert(
                situation.indicators.map((ind, idx) => ({
                  situation_id: situationData.id,
                  name: ind.name,
                  current_value: parseFloat(ind.currentValue) || 0,
                  target_value: parseFloat(ind.targetValue) || 0,
                  unit: ind.unit || null,
                  display_order: idx
                })) as any
              );

            if (situationIndicatorsError) throw situationIndicatorsError;
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });

      const labels = getInitiativeLabels(project.initiative_type);
      if (targetStatus === 'draft') {
        toast.success("Alterações salvas");
      } else {
        toast.success(labels.submitted);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Erro ao salvar projeto");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!projectId || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user?.id,
          comment: newComment.trim()
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      setNewComment("");
      toast.success("Comentário adicionado");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Erro ao adicionar comentário");
    }
  };

  const handleApprove = async () => {
    if (!project || !projectId) return;

    await transition({
      projectId: projectId,
      newStatus: 'approved',
      comment: newComment.trim() || undefined
    });

    setShowApproveDialog(false);
    onSuccess?.();
    onClose();
  };

  const handleReject = async () => {
    if (!project || !projectId) return;

    if (!newComment.trim()) {
      toast.error("Adicione um comentário explicando os ajustes necessários");
      return;
    }

    await transition({
      projectId: projectId,
      newStatus: 'draft',
      comment: newComment.trim()
    });

    setShowRejectDialog(false);
    setNewComment("");
    onSuccess?.();
    onClose();
  };

  const handleArchive = async () => {
    if (!project || !projectId) return;

    if (!newComment.trim()) {
      toast.error("Adicione um comentário explicando o motivo do arquivamento");
      return;
    }

    await transition({
      projectId: projectId,
      newStatus: 'archived',
      comment: newComment.trim()
    });

    setShowArchiveDialog(false);
    setNewComment("");
    onSuccess?.();
    onClose();
  };

  if (!project || isLoading) {
    return null;
  }

  const isActionPlan = project.initiative_type === 'action_plan';
  const labels = getInitiativeLabels(project.initiative_type);

  const isEditMode = project.status === 'draft';
  const isReviewMode = project.status === 'review';
  const canEdit = isEditMode && (user?.id === project.created_by || role === 'ceo');
  const canApprove = isReviewMode && role === 'ceo';
  const canComment = role === 'ceo' || user?.id === project.created_by;

  // Validações de requisitos - diferentes por tipo
  const hasIndicators = indicators.length > 0;
  const hasMilestones = milestones.length > 0;
  const hasObjective = objective.trim().length > 0;
  const hasContext = context.trim().length > 0;
  const hasPillar = !!strategicPillar;

  // Para Plano de Ação, requisitos são menores
  const allRequirementsMet = isActionPlan 
    ? projectName.trim().length > 0
    : hasIndicators && hasMilestones && hasObjective && hasContext && hasPillar;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle>
                  {isEditMode ? labels.edit : isReviewMode ? labels.review : labels.details}
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={isActionPlan ? "secondary" : "default"}>
                    {isActionPlan ? "Plano de Ação" : "Projeto"}
                  </Badge>
                  <Badge variant={project.status === 'review' ? 'default' : 'outline'}>
                    {project.status === 'draft' && '📝 Detalhamento'}
                    {project.status === 'review' && '⏳ Em Análise'}
                    {project.status === 'approved' && '✅ Aprovado'}
                    {project.status === 'archived' && '📦 Arquivado'}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 py-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'idea' | 'detail')} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="idea">{labels.ideaTab}</TabsTrigger>
                  <TabsTrigger value="detail">{labels.detailTab}</TabsTrigger>
                </TabsList>

                {/* Aba: Ideia Original */}
                <TabsContent value="idea" className="space-y-4">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">Descrição da Ideia</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ideia original submetida quando o projeto foi criado
                        </p>
                      </div>
                      <Separator />
                      <div className="prose prose-sm max-w-none">
                        {project.description ? (
                          <p className="whitespace-pre-wrap">{project.description}</p>
                        ) : (
                          <p className="text-muted-foreground italic">Nenhuma descrição de ideia disponível</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Aba: Detalhamento */}
                <TabsContent value="detail" className="space-y-6">
              {/* Modo Edição - Draft */}
              {canEdit && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="projectName" className="text-base font-semibold">
                      {labels.nameLabel} *
                    </Label>
                    <Input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  {/* Campos de Projeto (não mostrar para Plano de Ação) */}
                  {!isActionPlan && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="context" className="text-base font-semibold">
                          Contexto *
                        </Label>
                        <Textarea
                          id="context"
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pillar" className="text-base font-semibold">
                          Objetivo Estratégico *
                        </Label>
                        <Select value={strategicPillar} onValueChange={setStrategicPillar}>
                          <SelectTrigger id="pillar">
                            <SelectValue placeholder="Selecione o pilar" />
                          </SelectTrigger>
                          <SelectContent>
                            {strategicPillars.map(pillar => (
                              <SelectItem key={pillar.value} value={pillar.value}>
                                <span className="flex items-center gap-2">
                                  <span>{pillar.icon}</span>
                                  <span>{pillar.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="objective" className="text-base font-semibold">
                          Objetivo *
                        </Label>
                        <Textarea
                          id="objective"
                          value={objective}
                          onChange={(e) => setObjective(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="requirements" className="text-base font-semibold">
                          Requisitos
                        </Label>
                        <Textarea
                          id="requirements"
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          placeholder="Descreva os requisitos estratégicos que guiam o projeto"
                          className="min-h-[100px]"
                        />
                      </div>
                    </>
                  )}

                  {/* Situações (Metodologia A3) */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Metodologia A3 - Situação Atual vs Alvo</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSituation}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Situação
                        </Button>
                      </div>
                      
                      {situations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma situação adicionada. Use a metodologia A3 para definir o problema atual e o objetivo desejado.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {situations.map((situation, sitIndex) => (
                            <Card key={situation.id} className="p-4 border-2">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Situação {sitIndex + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSituation(situation.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label className="text-xs">❌ Problema Atual</Label>
                                    <Textarea
                                      placeholder="Descreva o problema ou situação atual"
                                      value={situation.currentProblem}
                                      onChange={(e) => updateSituation(situation.id, 'currentProblem', e.target.value)}
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">✅ Objetivo Desejado</Label>
                                    <Textarea
                                      placeholder="Descreva a situação desejada/objetivo"
                                      value={situation.targetGoal}
                                      onChange={(e) => updateSituation(situation.id, 'targetGoal', e.target.value)}
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                </div>

                                {/* Indicadores da Situação */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Indicadores desta Situação</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addIndicatorToSituation(situation.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Indicador
                                    </Button>
                                  </div>
                                  
                                  {situation.indicators.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">
                                      Nenhum indicador específico
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {situation.indicators.map((indicator) => (
                                        <div key={indicator.id} className="p-2 border rounded-lg space-y-2 bg-muted/30">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-xs">Indicador</Label>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeIndicatorFromSituation(situation.id, indicator.id)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="grid gap-2 md:grid-cols-2">
                                            <Input
                                              placeholder="Nome do indicador"
                                              value={indicator.name}
                                              onChange={(e) => updateIndicatorInSituation(situation.id, indicator.id, 'name', e.target.value)}
                                              className="text-xs"
                                            />
                                            <Input
                                              placeholder="Unidade (ex: %, R$, un)"
                                              value={indicator.unit}
                                              onChange={(e) => updateIndicatorInSituation(situation.id, indicator.id, 'unit', e.target.value)}
                                              className="text-xs"
                                            />
                                          </div>
                                          <div className="grid gap-2 md:grid-cols-2">
                                            <Input
                                              placeholder="Valor atual"
                                              value={indicator.currentValue}
                                              onChange={(e) => updateIndicatorInSituation(situation.id, indicator.id, 'currentValue', e.target.value)}
                                              className="text-xs"
                                            />
                                            <Input
                                              placeholder="Valor desejado"
                                              value={indicator.targetValue}
                                              onChange={(e) => updateIndicatorInSituation(situation.id, indicator.id, 'targetValue', e.target.value)}
                                              className="text-xs"
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                   )}
                                 </div>

                                 {/* Separador de Anexos */}
                                 <div className="border-t pt-3">
                                   <div className="flex items-center justify-between mb-2">
                                     <Label className="text-sm font-semibold">Anexos</Label>
                                   </div>

                                   {situation.attachments.length > 0 && (
                                     <div className="space-y-1 mb-2">
                                       {situation.attachments.map((file, fileIndex) => (
                                         <div key={fileIndex} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                                           <div className="flex items-center gap-2 flex-1 min-w-0">
                                             <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                             <span className="text-sm truncate">{file.name}</span>
                                             <span className="text-xs text-muted-foreground">
                                               ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                             </span>
                                           </div>
                                           <Button
                                             type="button"
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => removeAttachmentFromSituation(situation.id, fileIndex)}
                                           >
                                             <Trash2 className="h-3 w-3 text-destructive" />
                                           </Button>
                                         </div>
                                       ))}
                                     </div>
                                   )}

                                   <div>
                                     <Input
                                       type="file"
                                       multiple
                                       accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                       onChange={(e) => addAttachmentsToSituation(situation.id, e.target.files)}
                                       className="text-sm"
                                       id={`file-${situation.id}`}
                                     />
                                     <p className="text-xs text-muted-foreground mt-1">
                                       Máx. 50MB por arquivo. Formatos: PDF, PPT, DOC, XLS, imagens
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             </Card>
                           ))}
                         </div>
                       )}
                     </div>
                   </Card>

                  {/* Membros */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <h3 className="text-base font-semibold">Membros do Projeto</h3>
                      </div>

                      {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedMembers.map(memberId => {
                            const member = availableMembers.find(m => m.id === memberId);
                            if (!member) return null;
                            return (
                              <Badge key={memberId} variant="secondary" className="flex items-center gap-2 py-2 px-3">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.avatar_url || undefined} />
                                  <AvatarFallback>{member.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{member.full_name}</span>
                                <X 
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => handleRemoveMember(memberId)}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <Popover open={membersPopoverOpen} onOpenChange={setMembersPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Membro
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar pessoa..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                              <CommandGroup>
                                {availableMembers
                                  .filter(m => !selectedMembers.includes(m.id))
                                  .map(member => (
                                    <CommandItem
                                      key={member.id}
                                      onSelect={() => handleAddMember(member.id)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={member.avatar_url || undefined} />
                                          <AvatarFallback>{member.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                          <span className="text-sm">{member.full_name}</span>
                                          <span className="text-xs text-muted-foreground">{member.email}</span>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </Card>

                  {/* Indicadores */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Indicadores *</h3>
                      <div className="space-y-3">
                        {indicators.map((indicator, index) => (
                          <div key={indicator.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Indicador {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIndicator(indicator.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Como está hoje</Label>
                                <Input
                                  placeholder="Ex: 45% de retrabalho"
                                  value={indicator.currentState}
                                  onChange={(e) =>
                                    updateIndicator(indicator.id, "currentState", e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Meta desejada</Label>
                                <Input
                                  placeholder="Ex: 15% de retrabalho"
                                  value={indicator.targetState}
                                  onChange={(e) =>
                                    updateIndicator(indicator.id, "targetState", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIndicator}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Indicador
                      </Button>
                    </div>
                  </Card>

                  {/* Milestones */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Milestones *</h3>
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <div key={milestone.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Milestone {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMilestone(milestone.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Título</Label>
                                <Input
                                  placeholder="Ex: Conclusão da Fase 1"
                                  value={milestone.title}
                                  onChange={(e) =>
                                    updateMilestone(milestone.id, "title", e.target.value)
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Data Prevista</Label>
                                <Input
                                  type="date"
                                  value={milestone.targetDate}
                                  onChange={(e) =>
                                    updateMilestone(milestone.id, "targetDate", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMilestone}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Milestone
                      </Button>
                    </div>
                  </Card>
                </>
              )}

              {/* Modo Revisão - Review */}
              {isReviewMode && !canEdit && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">{labels.nameLabel}</Label>
                      <p className="text-base font-medium mt-1">{project.name}</p>
                    </div>

                    {/* Campos de Plano de Ação (5W2H) */}
                    {isActionPlan ? (
                      <>
                        <Separator />
                        {project.what && (
                          <div>
                            <Label className="text-sm text-muted-foreground">O quê? (What)</Label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{project.what}</p>
                          </div>
                        )}
                        <Separator />
                        {project.why && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Por quê? (Why)</Label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{project.why}</p>
                          </div>
                        )}
                        <Separator />
                        {project.who && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Quem? (Who)</Label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{project.who}</p>
                          </div>
                        )}
                        <Separator />
                        <div>
                          <Label className="text-sm text-muted-foreground">Quando? (When)</Label>
                          <p className="text-sm mt-1">
                            {project.when_start && `Início: ${new Date(project.when_start).toLocaleDateString('pt-BR')}`}
                            {project.when_start && project.when_end && ' • '}
                            {project.when_end && `Término: ${new Date(project.when_end).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        {project.where_location && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm text-muted-foreground">Onde? (Where)</Label>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{project.where_location}</p>
                            </div>
                          </>
                        )}
                        {project.how && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm text-muted-foreground">Como? (How)</Label>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{project.how}</p>
                            </div>
                          </>
                        )}
                        {project.how_much && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm text-muted-foreground">Quanto? (How Much)</Label>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{project.how_much}</p>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Campos de Projeto */}
                        <Separator />
                        <div>
                          <Label className="text-sm text-muted-foreground">Contexto</Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{project.context}</p>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm text-muted-foreground">Objetivo Estratégico</Label>
                          <p className="text-base mt-1">
                            {strategicPillars.find(p => p.value === project.strategic_pillar)?.icon}{' '}
                            {strategicPillars.find(p => p.value === project.strategic_pillar)?.label}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm text-muted-foreground">Objetivo</Label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{project.objective}</p>
                        </div>

                        <Separator />

                        {/* Validação de Requisitos - Apenas para Projeto */}
                        <Card className="p-4 bg-muted/50">
                          <h3 className="text-sm font-semibold mb-3">Requisitos para Aprovação</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {hasIndicators ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                Indicadores ({project.indicators.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasMilestones ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                Milestones ({project.milestones.length})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasObjective ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">Objetivo detalhado</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasContext ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">Contexto completo</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasPillar ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">Objetivo estratégico definido</span>
                            </div>
                          </div>

                          {!allRequirementsMet && (
                            <div className="mt-3 flex items-start gap-2 text-orange-600">
                              <AlertCircle className="h-4 w-4 mt-0.5" />
                              <p className="text-xs">
                                Alguns requisitos não foram atendidos. Considere reprovar para ajustes.
                              </p>
                            </div>
                          )}
                        </Card>
                      </>
                    )}

                    <Separator />

                    {/* Indicadores Visualização */}
                    {project.indicators.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold mb-3">Indicadores</h3>
                        <div className="space-y-2">
                          {project.indicators.map((ind, index) => (
                            <Card key={ind.id} className="p-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                Indicador {index + 1}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Hoje:</span> {ind.current_state}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Meta:</span> {ind.target_state}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Milestones Visualização */}
                    {project.milestones.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold mb-3">Milestones</h3>
                        <div className="space-y-2">
                          {project.milestones.map((ms) => (
                            <Card key={ms.id} className="p-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{ms.title}</span>
                                <span className="text-muted-foreground">
                                  {new Date(ms.target_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />
                  </div>
                </>
              )}

              </TabsContent>
            </Tabs>

            {/* Comentários */}
              {(isReviewMode || project.comments.length > 0) && (
                <>
                  <Separator />
                  <ProjectComments
                    comments={project.comments}
                    canComment={canComment}
                    newComment={newComment}
                    onCommentChange={setNewComment}
                    onAddComment={handleAddComment}
                  />
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer com ações */}
          <div className="px-6 py-4 border-t bg-background">
            {canEdit && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  onClick={() => handleSave('review')}
                  disabled={saving}
                  className="flex-1"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Aprovação
                </Button>
              </div>
            )}

            {canApprove && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isTransitioning}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Solicitar Ajustes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowArchiveDialog(true)}
                    disabled={isTransitioning}
                    className="flex-1"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar
                  </Button>
                </div>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isTransitioning}
                  className="w-full"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {labels.approve}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Aprovação */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.approveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.approveDescription(project?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-sm">Comentário (opcional)</Label>
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Confirmar Aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Reprovação */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.rejectTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.rejectDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-sm">Comentário * (obrigatório)</Label>
            <Textarea
              placeholder="Explique o que precisa ser ajustado..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!newComment.trim()}
            >
              Solicitar Ajustes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Arquivamento */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.archiveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.archiveDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label className="text-sm">Comentário * (obrigatório)</Label>
            <Textarea
              placeholder="Explique o motivo do arquivamento..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={!newComment.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Arquivamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

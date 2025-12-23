import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X, Users, Save, Send, CheckCircle2, XCircle, Archive, FileText, Trash2, Lightbulb, Briefcase, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useProjectTransitions } from "@/hooks/useProjectTransitions";
import { ProjectComments } from "@/components/projects/ProjectComments";
import { ConvertIdeaDialog } from "@/components/projects/ConvertIdeaDialog";
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

const ProjectDetail = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProjectDetails(projectId || null);
  const { transition, isTransitioning } = useProjectTransitions();

  const [activeTab, setActiveTab] = useState("idea");
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
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para campos 5W2H (Plano de Ação)
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [how, setHow] = useState("");
  const [who, setWho] = useState("");
  const [whereLocation, setWhereLocation] = useState("");
  const [whenStart, setWhenStart] = useState("");
  const [whenEnd, setWhenEnd] = useState("");
  const [howMuch, setHowMuch] = useState("");

  const isIdea = project?.initiative_type === 'idea';
  const isActionPlan = project?.initiative_type === 'action_plan';
  const labels = project ? getInitiativeLabels(project.initiative_type) : getInitiativeLabels('project');

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

  // Carregar dados do projeto
  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setContext(project.context || '');
      setStrategicPillar(project.strategic_pillar || '');
      setObjective(project.objective || '');
      setRequirements(project.requirements || '');

      // Campos 5W2H para Planos de Ação
      setWhat((project as any).what || '');
      setWhy((project as any).why || '');
      setHow((project as any).how || '');
      setWho((project as any).who || '');
      setWhereLocation((project as any).where_location || '');
      setWhenStart((project as any).when_start || '');
      setWhenEnd((project as any).when_end || '');
      setHowMuch((project as any).how_much || '');

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
    }
  }, [project]);

  // Carregar situações do projeto
  useEffect(() => {
    if (projectId && project) {
      const loadSituations = async () => {
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
          .eq('project_id', projectId)
          .order('display_order');

        if (situationsData) {
          const situationsWithData = situationsData.map((s: any) => ({
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
          }));
          setSituations(situationsWithData);
        }
      };

      loadSituations();
    }
  }, [projectId, project]);

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

  // Funções para gerenciar situações
  const addSituation = () => {
    const newSituation: Situation = {
      id: crypto.randomUUID(),
      currentProblem: "",
      targetGoal: "",
      indicators: [],
      attachments: []
    };
    setSituations([...situations, newSituation]);
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

    if (!projectName.trim()) {
      toast.error(`Nome ${labels.article === 'o' ? 'do' : 'da'} ${labels.singular.toLowerCase()} é obrigatório`);
      return;
    }

    // Validações para Plano de Ação
    if (isActionPlan) {
      if (targetStatus === 'review') {
        if (!what.trim()) {
          toast.error("Campo 'O quê' é obrigatório");
          return;
        }
        if (!why.trim()) {
          toast.error("Campo 'Por quê' é obrigatório");
          return;
        }
        if (!whenEnd) {
          toast.error("Data de término é obrigatória");
          return;
        }
      }
    } else {
      // Validações para Projeto
      if (!context.trim()) {
        toast.error("Contexto é obrigatório");
        return;
      }

      if (targetStatus === 'review') {
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
      // Preparar dados base
      let updateData: any = {
        name: projectName,
        status: targetStatus,
        submitted_for_review_at: targetStatus === 'review' ? new Date().toISOString() : project.submitted_for_review_at
      };

      // Adicionar campos específicos do tipo
      if (isActionPlan) {
        updateData = {
          ...updateData,
          what,
          why,
          how: how || null,
          who: who || null,
          where_location: whereLocation || null,
          when_start: whenStart || null,
          when_end: whenEnd,
          how_much: howMuch || null,
        };
      } else {
        updateData = {
          ...updateData,
          context: context,
          requirements: requirements || null,
          strategic_pillar: (strategicPillar || null) as 'operational_efficiency' | 'sales_expansion' | 'new_business' | null,
          objective: objective || null,
        };
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (updateError) throw updateError;

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

      // Salvar situações com indicadores e anexos
      if (situations.length > 0) {
        // Deletar situações anteriores (cascade irá deletar indicadores e anexos relacionados)
        await supabase
          .from('project_situations')
          .delete()
          .eq('project_id', projectId);

        // Inserir novas situações
        for (const [index, sit] of situations.entries()) {
          const { data: situationData, error: situationError } = await supabase
            .from('project_situations')
            .insert({
              project_id: projectId,
              current_problem: sit.currentProblem,
              target_goal: sit.targetGoal,
              display_order: index,
              created_by: user?.id
            })
            .select()
            .single();

          if (situationError) throw situationError;

          // Inserir indicadores da situação
          if (sit.indicators.length > 0) {
            const { error: indicatorsError } = await supabase
              .from('situation_indicators')
              .insert(
                sit.indicators.map((ind, indIndex) => ({
                  situation_id: situationData.id,
                  name: ind.name,
                  current_value: parseFloat(ind.currentValue) || 0,
                  target_value: parseFloat(ind.targetValue) || 0,
                  unit: ind.unit || null,
                  display_order: indIndex
                }))
              );

            if (indicatorsError) throw indicatorsError;
          }

          // Upload de anexos
          if (sit.attachments.length > 0) {
            for (const file of sit.attachments) {
              const fileExt = file.name.split('.').pop();
              const filePath = `${situationData.id}/${Date.now()}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from('project-attachments')
                .upload(filePath, file);

              if (uploadError) {
                console.error('Upload error:', uploadError);
                toast.error(`Erro ao enviar ${file.name}`);
                continue;
              }

              const { error: attachmentError } = await supabase
                .from('situation_attachments')
                .insert({
                  situation_id: situationData.id,
                  file_name: file.name,
                  file_path: filePath,
                  file_size: file.size,
                  file_type: file.type,
                  uploaded_by: user?.id
                });

              if (attachmentError) {
                console.error('Attachment record error:', attachmentError);
              }
            }
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
        navigate('/prioritization');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Erro ao salvar projeto");
    } finally {
      setSaving(false);
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
    navigate('/prioritization');
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
    navigate('/prioritization');
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
    navigate('/prioritization');
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

  const isEditMode = project.status === 'draft';
  const isReviewMode = project.status === 'review';
  const canEdit = isEditMode && (user?.id === project.created_by || role === 'ceo');
  const canApprove = isReviewMode && role === 'ceo';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant={project.status === 'review' ? 'default' : 'secondary'} className="mt-1">
                  {project.status === 'idea' && '💡 Ideia'}
                  {project.status === 'draft' && '📝 Detalhamento'}
                  {project.status === 'review' && '⏳ Em Análise'}
                  {project.status === 'approved' && '✅ Aprovado'}
                  {project.status === 'archived' && '📦 Arquivado'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Idea Conversion Banner */}
      {isIdea && (
        <div className="max-w-6xl mx-auto px-8 pt-6">
          <Card className="p-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Esta é uma ideia</p>
                  <p className="text-sm text-yellow-700">Converta-a em projeto ou plano de ação para começar a executá-la.</p>
                </div>
              </div>
              <Button onClick={() => setShowConvertDialog(true)} className="bg-yellow-600 hover:bg-yellow-700">
                Converter Ideia
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="idea">{labels.ideaTab}</TabsTrigger>
            <TabsTrigger value="detail">{labels.detailTab}</TabsTrigger>
          </TabsList>

          {/* Aba: Ideia Original */}
          <TabsContent value="idea" className="space-y-6">
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
            {canEdit ? (
              <>
                {/* Modo Edição */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label htmlFor="projectName" className="text-base font-semibold">
                        Nome do Projeto *
                      </Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label htmlFor="context" className="text-base font-semibold">
                        Contexto *
                      </Label>
                      <Textarea
                        id="context"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="min-h-[150px]"
                        placeholder="Descreva o contexto detalhado do projeto..."
                      />
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="space-y-4">
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
                  </Card>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label htmlFor="objective" className="text-base font-semibold">
                        Objetivo *
                      </Label>
                      <Textarea
                        id="objective"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Defina o objetivo do projeto..."
                      />
                    </div>
                  </Card>

                  {/* Requisitos do Projeto */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <Label htmlFor="requirements" className="text-base font-semibold">
                        Requisitos do Projeto
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Quais são os requisitos essenciais para o sucesso deste projeto?
                      </p>
                      <Textarea
                        id="requirements"
                        placeholder="Liste os requisitos principais do projeto (recursos, aprovações, pré-condições, etc.)..."
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </Card>

                  {/* Situação Atual vs Situação Alvo */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold mb-1">Situação Atual vs Situação Alvo</h3>
                        <p className="text-sm text-muted-foreground">
                          Mapeie os problemas atuais e as metas correspondentes que o projeto deve alcançar.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {situations.map((situation, index) => (
                          <div key={situation.id} className="p-4 border rounded-lg bg-background space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Situação {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSituation(situation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Descrições */}
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-sm">Situação Atual / Problema</Label>
                                <Textarea
                                  placeholder="Ex: Alto índice de retrabalho nos processos"
                                  value={situation.currentProblem}
                                  onChange={(e) => updateSituation(situation.id, "currentProblem", e.target.value)}
                                  rows={2}
                                  className="resize-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-sm">Situação Alvo / Meta</Label>
                                <Textarea
                                  placeholder="Ex: Processo padronizado e com baixo retrabalho"
                                  value={situation.targetGoal}
                                  onChange={(e) => updateSituation(situation.id, "targetGoal", e.target.value)}
                                  rows={2}
                                  className="resize-none"
                                />
                              </div>
                            </div>

                            {/* Separador de Indicadores */}
                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-semibold">Indicadores</Label>
                              </div>
                              
                              {situation.indicators.length > 0 && (
                                <div className="space-y-2 mb-2">
                                  {situation.indicators.map((indicator) => (
                                    <div key={indicator.id} className="p-3 border rounded bg-muted/30 space-y-2">
                                      <div className="flex items-start gap-2">
                                        <div className="flex-1 space-y-2">
                                          <Input
                                            placeholder="Nome do indicador"
                                            value={indicator.name}
                                            onChange={(e) => updateIndicatorInSituation(
                                              situation.id, 
                                              indicator.id, 
                                              "name", 
                                              e.target.value
                                            )}
                                            className="text-sm"
                                          />
                                          <div className="grid grid-cols-3 gap-2">
                                            <Input
                                              placeholder="Atual"
                                              value={indicator.currentValue}
                                              onChange={(e) => updateIndicatorInSituation(
                                                situation.id, 
                                                indicator.id, 
                                                "currentValue", 
                                                e.target.value
                                              )}
                                              className="text-sm"
                                            />
                                            <Input
                                              placeholder="Meta"
                                              value={indicator.targetValue}
                                              onChange={(e) => updateIndicatorInSituation(
                                                situation.id, 
                                                indicator.id, 
                                                "targetValue", 
                                                e.target.value
                                              )}
                                              className="text-sm"
                                            />
                                            <Input
                                              placeholder="Unid."
                                              value={indicator.unit}
                                              onChange={(e) => updateIndicatorInSituation(
                                                situation.id, 
                                                indicator.id, 
                                                "unit", 
                                                e.target.value
                                              )}
                                              className="text-sm"
                                            />
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeIndicatorFromSituation(situation.id, indicator.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addIndicatorToSituation(situation.id)}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Adicionar Indicador
                              </Button>
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
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSituation}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Situação
                      </Button>
                    </div>
                  </Card>

                  {/* Membros */}
                  <Card className="p-6">
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
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Indicadores *</h3>
                      <div className="space-y-3">
                        {indicators.map((indicator, index) => (
                          <div key={indicator.id} className="p-4 border rounded-lg space-y-2">
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
                            <div className="grid gap-3 md:grid-cols-2">
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
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">Milestones *</h3>
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <div key={milestone.id} className="p-4 border rounded-lg space-y-2">
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
                            <div className="grid gap-3 md:grid-cols-2">
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
                </div>
              </>
            ) : (
              <>
                {/* Modo Visualização */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Contexto</Label>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{project.context || 'Sem contexto'}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Objetivo Estratégico</Label>
                        <p className="text-base mt-2">
                          {project.strategic_pillar && strategicPillars.find(p => p.value === project.strategic_pillar)?.icon}{' '}
                          {project.strategic_pillar && strategicPillars.find(p => p.value === project.strategic_pillar)?.label}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Objetivo</Label>
                        <p className="text-sm mt-2 whitespace-pre-wrap">{project.objective || 'Sem objetivo'}</p>
                      </div>
                    </div>
                  </Card>

                  {project.indicators.length > 0 && (
                    <Card className="p-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold">Indicadores</h3>
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
                    </Card>
                  )}

                  {project.milestones.length > 0 && (
                    <Card className="p-6">
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold">Milestones</h3>
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
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Comentários */}
            {(isReviewMode || project.comments.length > 0) && (
              <Card className="p-6">
                <ProjectComments
                  comments={project.comments}
                  canComment={role === 'ceo' || user?.id === project.created_by}
                  newComment={newComment}
                  onCommentChange={setNewComment}
                  onAddComment={async () => {
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
                  }}
                />
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer com ações */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="max-w-6xl mx-auto px-8 py-4">
          {canEdit && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={() => handleSave('review')}
                disabled={saving}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar para Aprovação
              </Button>
            </div>
          )}

          {canApprove && (
            <div className="space-y-2">
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isTransitioning}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Solicitar Ajustes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={isTransitioning}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isTransitioning}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {getInitiativeLabels(project?.initiative_type).approve}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogos */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getInitiativeLabels(project?.initiative_type).approveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {getInitiativeLabels(project?.initiative_type).approveDescription(project?.name || '')}
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

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getInitiativeLabels(project?.initiative_type).rejectTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {getInitiativeLabels(project?.initiative_type).rejectDescription}
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

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getInitiativeLabels(project?.initiative_type).archiveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {getInitiativeLabels(project?.initiative_type).archiveDescription}
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

      {/* Convert Idea Dialog */}
      <ConvertIdeaDialog
        open={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        idea={project ? { id: project.id, name: project.name, description: project.description } : null}
      />
    </div>
  );
};

export default ProjectDetail;

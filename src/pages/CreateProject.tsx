import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Users, Save, Send, ArrowLeft, FileText, Upload, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/config/categories";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { LabelWithHelp } from "@/components/ui/help-tooltip";
import { GuidePopover } from "@/components/ui/guide-popover";
import { REQUIREMENT_EXAMPLES, REQUIREMENT_QUESTIONS, CURRENT_SITUATION_QUESTIONS, TARGET_SITUATION_QUESTIONS } from "@/config/guideContent";

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

interface Situation {
  id: string;
  currentProblem: string;
  targetGoal: string;
  attachments: File[];
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface CreateProjectProps {
  mode?: 'create' | 'structure';
}

const CreateProject = ({ mode = 'create' }: CreateProjectProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { role } = useUserRole();
  
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState<ProjectCategory | "">("");
  const [context, setContext] = useState("");
  const [strategicPillar, setStrategicPillar] = useState("");
  const [objective, setObjective] = useState("");
  const [requirements, setRequirements] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [suggestingName, setSuggestingName] = useState(false);

  // Track form changes for unsaved changes warning
  const hasFormContent = useMemo(() => {
    return projectName.trim() !== '' ||
           context.trim() !== '' ||
           objective.trim() !== '' ||
           indicators.length > 0 ||
           milestones.length > 0 ||
           situations.length > 0;
  }, [projectName, context, objective, indicators, milestones, situations]);

  const hasUnsavedChanges = hasFormContent && !isSaved;

  const {
    isBlocked,
    proceedNavigation,
    cancelNavigation,
  } = useUnsavedChanges(hasUnsavedChanges);

  const handleSuggestName = async () => {
    if (!objective.trim()) {
      toast.error("Preencha o Objetivo primeiro para gerar sugestões de nome");
      return;
    }
    setSuggestingName(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-project-name', {
        body: { objective: objective.trim(), category: category || undefined },
      });
      if (error) throw error;
      setNameSuggestions(data?.suggestions || []);
    } catch (err) {
      console.error('Error suggesting name:', err);
      toast.error("Não foi possível gerar sugestões. Verifique se a função está configurada.");
    } finally {
      setSuggestingName(false);
    }
  };

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

  // Carregar ideia existente se estiver no modo 'structure'
  useEffect(() => {
    if (mode === 'structure' && id) {
      const fetchIdea = async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('status', 'idea')
          .single();

        if (error) {
          console.error('Error fetching idea:', error);
          toast.error("Erro ao carregar ideia");
          navigate('/strategy');
        } else if (data) {
          setProjectName(data.name);
          setContext(data.description || '');
          setRequirements(data.requirements || '');
          setStrategicPillar(data.strategic_pillar || '');
          setObjective(data.objective || '');

          // Carregar indicadores
          const { data: indicatorsData } = await supabase
            .from('project_indicators')
            .select('*')
            .eq('project_id', id);
          
          if (indicatorsData) {
            setIndicators(indicatorsData.map(ind => ({
              id: ind.id,
              currentState: ind.current_state,
              targetState: ind.target_state
            })));
          }

          // Carregar milestones
          const { data: milestonesData } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', id);
          
          if (milestonesData) {
            setMilestones(milestonesData.map(ms => ({
              id: ms.id,
              title: ms.title,
              targetDate: ms.target_date
            })));
          }

          // Carregar situações
          const { data: situationsData } = await supabase
            .from('project_situations')
            .select('*')
            .eq('project_id', id)
            .order('display_order');

          if (situationsData) {
            // Carregar situações (sem indicadores)
            const situationsWithData = situationsData.map((s) => ({
              id: s.id,
              currentProblem: s.current_problem,
              targetGoal: s.target_goal,
              attachments: [] // Não carregamos arquivos existentes na edição (apenas metadados são exibidos em outro lugar)
            }));
            setSituations(situationsWithData);
          }

          // Carregar membros
          const { data: membersData } = await supabase
            .from('project_members')
            .select('user_id')
            .eq('project_id', id);
          
          if (membersData) {
            setSelectedMembers(membersData.map(m => m.user_id));
          }
        }
      };

      fetchIdea();
    }
  }, [mode, id, navigate]);

  const addIndicator = () => {
    const newIndicator: Indicator = {
      id: crypto.randomUUID(),
      currentState: "",
      targetState: "",
    };
    setIndicators([...indicators, newIndicator]);
  };

  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter((ind) => ind.id !== id));
  };

  const updateIndicator = (id: string, field: keyof Indicator, value: string) => {
    setIndicators(
      indicators.map((ind) =>
        ind.id === id ? { ...ind, [field]: value } : ind
      )
    );
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: "",
      targetDate: "",
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((mile) => mile.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(
      milestones.map((mile) =>
        mile.id === id ? { ...mile, [field]: value } : mile
      )
    );
  };

  const addSituation = () => {
    const newSituation: Situation = {
      id: crypto.randomUUID(),
      currentProblem: "",
      targetGoal: "",
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

  const handleSubmit = async (targetStatus: 'draft' | 'review') => {
    // Validações básicas
    if (!projectName.trim()) {
      toast.error("Nome do projeto é obrigatório");
      return;
    }

    if (!category) {
      toast.error("Categoria é obrigatória");
      return;
    }

    if (!context.trim()) {
      toast.error("Contexto é obrigatório");
      return;
    }

    // Validações para envio para aprovação
    if (targetStatus === 'review') {
      if (!strategicPillar) {
        toast.error("Objetivo estratégico é obrigatório para enviar para aprovação");
        return;
      }
      if (!objective.trim()) {
        toast.error("Objetivo é obrigatório para enviar para aprovação");
        return;
      }
      if (indicators.length === 0) {
        toast.error("Adicione pelo menos 1 indicador para enviar para aprovação");
        return;
      }
      if (milestones.length === 0) {
        toast.error("Adicione pelo menos 1 milestone para enviar para aprovação");
        return;
      }
      // CHG-05: Require at least 1 image in situations
      const hasImage = situations.some(s =>
        s.attachments.some(f => /\.(png|jpg|jpeg)$/i.test(f.name))
      );
      if (!hasImage) {
        toast.error("Anexe pelo menos 1 imagem como evidência na Situação Atual");
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Salvar/atualizar projeto
      const projectData = {
        name: projectName,
        category: category as any,
        context: context,
        requirements: requirements || null,
        strategic_pillar: (strategicPillar || null) as 'operational_efficiency' | 'sales_expansion' | 'new_business' | null,
        objective: objective || null,
        status: targetStatus,
        assigned_to: null,
        created_by: user?.id,
        submitted_for_review_at: targetStatus === 'review' ? new Date().toISOString() : null
      };

      let projectId: string;

      if (mode === 'structure' && id) {
        // Atualizar ideia existente
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', id);

        if (updateError) throw updateError;
        projectId = id;
      } else {
        // Criar novo projeto
        const { data: projectResult, error: insertError } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (insertError) throw insertError;
        projectId = projectResult.id;
      }

      // 2. Salvar indicadores (deletar anteriores se existirem)
      if (indicators.length > 0) {
        // Deletar indicadores anteriores
        await supabase
          .from('project_indicators')
          .delete()
          .eq('project_id', projectId);

        // Inserir novos
        const { error: indicatorsError } = await supabase
          .from('project_indicators')
          .insert(
            indicators.map(ind => ({
              project_id: projectId,
              current_state: ind.currentState,
              target_state: ind.targetState
            }))
          );

        if (indicatorsError) throw indicatorsError;
      }

      // 3. Salvar milestones (deletar anteriores se existirem)
      if (milestones.length > 0) {
        // Deletar milestones anteriores
        await supabase
          .from('project_milestones')
          .delete()
          .eq('project_id', projectId);

        // Inserir novos
        const { error: milestonesError } = await supabase
          .from('project_milestones')
          .insert(
            milestones.map(ms => ({
              project_id: projectId,
              title: ms.title,
              target_date: ms.targetDate
            }))
          );

        if (milestonesError) throw milestonesError;
      }

      // 4. Salvar membros (deletar anteriores se existirem)
      console.log('[SAVE] selectedMembers:', selectedMembers);
      const { error: deleteMemError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      if (deleteMemError) console.error('[SAVE] Erro ao deletar membros:', deleteMemError);
      else console.log('[SAVE] Membros anteriores deletados com sucesso');

      if (selectedMembers.length > 0) {
        const membersToInsert = selectedMembers.map(memberId => ({
          project_id: projectId,
          user_id: memberId,
          added_by: user?.id
        }));
        console.log('[SAVE] Inserindo membros:', membersToInsert);

        const { data: membersResult, error: membersError } = await supabase
          .from('project_members')
          .insert(membersToInsert)
          .select();

        console.log('[SAVE] Resultado insert membros:', { membersResult, membersError });
        if (membersError) throw membersError;
      } else {
        console.log('[SAVE] Nenhum membro selecionado, pulando insert');
      }

      // 5. Salvar situações com indicadores e anexos
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


          // 5b. Upload de anexos
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

      // Mark as saved on success
      setIsSaved(true);

      // Feedback de sucesso
      if (targetStatus === 'draft') {
        toast.success("Salvo em Detalhamento", {
          description: "Continue estruturando quando quiser"
        });
      } else {
        toast.success("Projeto enviado para aprovação", {
          description: "O CEO será notificado para revisar"
        });
        navigate('/prioritization');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Erro ao salvar projeto", {
        description: "Verifique sua conexão e tente novamente."
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container max-w-4xl py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/prioritization')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {mode === 'structure' ? 'Estruturar Projeto' : 'Criar Novo Projeto'}
        </h1>
        <p className="text-muted-foreground">
          Estruture seu projeto estratégico seguindo a metodologia A3
        </p>
      </div>

      <div className="space-y-6">
          {/* Nome do Projeto */}
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="projectName" className="text-base font-semibold">
                  Nome do Projeto *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestName}
                  disabled={suggestingName}
                  className="gap-1"
                >
                  {suggestingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Sugerir Nome
                </Button>
              </div>
              <Input
                id="projectName"
                placeholder="Ex: Redução de Custos Operacionais"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-base"
              />
              {nameSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {nameSuggestions.map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => { setProjectName(s); setNameSuggestions([]); }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Categoria */}
          <Card className="p-6">
            <div className="space-y-2">
              <LabelWithHelp
                label="Categoria"
                htmlFor="category"
                helpKey="category"
                required
              />
              <Select value={category} onValueChange={(val) => setCategory(val as ProjectCategory)}>
                <SelectTrigger id="category" className="text-base">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Contexto */}
          <Card className="p-6">
            <div className="space-y-2">
              <LabelWithHelp
                label="Contexto"
                htmlFor="context"
                helpKey="context"
                required
              />
              <Textarea
                id="context"
                placeholder="Descreva o contexto, problema atual ou oportunidade..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
          </Card>

          {/* Objetivo Estratégico */}
          <Card className="p-6">
            <div className="space-y-2">
              <LabelWithHelp
                label="Objetivo Estratégico"
                htmlFor="pillar"
                helpKey="strategicPillar"
                required
              />
              <Select value={strategicPillar} onValueChange={setStrategicPillar}>
                <SelectTrigger id="pillar" className="text-base">
                  <SelectValue placeholder="Selecione o objetivo estratégico" />
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

          {/* Objetivo */}
          <Card className="p-6">
            <div className="space-y-2">
              <LabelWithHelp
                label="Objetivo"
                htmlFor="objective"
                helpKey="objective"
                required
              />
              <Textarea
                id="objective"
                placeholder="Descreva o objetivo de forma clara e mensurável..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="min-h-[80px] text-base"
              />
            </div>
          </Card>

          {/* Requisitos do Projeto */}
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <LabelWithHelp
                  label="Requisitos do Projeto"
                  htmlFor="requirements"
                  helpKey="requirements"
                />
                <div className="flex gap-1">
                  <GuidePopover items={REQUIREMENT_EXAMPLES} count={5} label="Ver Exemplos" title="Exemplos de requisitos:" />
                  <GuidePopover items={REQUIREMENT_QUESTIONS} count={4} label="Perguntas-Chave" title="Responda e transforme em requisito:" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Quais são os requisitos essenciais para o sucesso deste projeto?
              </p>
              <Textarea
                id="requirements"
                placeholder="Liste os requisitos principais do projeto (recursos, aprovações, pré-condições, etc.)..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="min-h-[100px] text-base"
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
                        <div className="flex items-center justify-between">
                          <LabelWithHelp
                            label="Situação Atual / Problema"
                            helpKey="situationCurrent"
                          />
                          <GuidePopover items={CURRENT_SITUATION_QUESTIONS} count={5} label="Perguntas-Guia" title="Perguntas para descrever o problema:" />
                        </div>
                        <Textarea
                          placeholder="Ex: Alto índice de retrabalho nos processos"
                          value={situation.currentProblem}
                          onChange={(e) => updateSituation(situation.id, "currentProblem", e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <LabelWithHelp
                            label="Situação Alvo / Meta"
                            helpKey="situationTarget"
                          />
                          <GuidePopover items={TARGET_SITUATION_QUESTIONS} count={5} label="Perguntas-Guia" title="Perguntas para definir o alvo:" />
                        </div>
                        <Textarea
                          placeholder="Ex: Processo padronizado e com baixo retrabalho"
                          value={situation.targetGoal}
                          onChange={(e) => updateSituation(situation.id, "targetGoal", e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>

                    {/* Separador de Anexos */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Anexos</Label>
                      </div>

                      {situation.attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {situation.attachments.map((file, fileIndex) => {
                            const isImage = /\.(png|jpg|jpeg)$/i.test(file.name);
                            return (
                              <div key={fileIndex} className="border rounded bg-muted/30">
                                <div className="flex items-center justify-between p-2">
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
                                {isImage && (
                                  <div className="px-2 pb-2">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="w-full max-h-[400px] object-contain rounded border"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

          {/* Membros do Projeto */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros do Projeto
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione pessoas que farão parte da equipe do projeto
                  </p>
                </div>
              </div>

              {/* Lista de membros selecionados */}
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

              {/* Botão para adicionar membro */}
              <Popover open={membersPopoverOpen} onOpenChange={setMembersPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
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
                        <ScrollArea className="h-[200px]">
                          {availableMembers
                            .filter(m => !selectedMembers.includes(m.id))
                            .map(member => (
                              <CommandItem
                                key={member.id}
                                onSelect={() => handleAddMember(member.id)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback>{member.full_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{member.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </ScrollArea>
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
              <LabelWithHelp
                label="Indicadores"
                helpKey="indicator"
                className="text-base font-semibold"
              />

              <div className="space-y-3">
                {indicators.map((indicator, index) => (
                  <div
                    key={indicator.id}
                    className="p-4 border rounded-lg bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Indicador {index + 1}
                      </span>
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
                        <Label className="text-sm">Como está hoje</Label>
                        <Input
                          placeholder="Ex: 45% de retrabalho"
                          value={indicator.currentState}
                          onChange={(e) =>
                            updateIndicator(indicator.id, "currentState", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Meta desejada</Label>
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
              <LabelWithHelp
                label="Milestones Relevantes"
                helpKey="milestone"
                className="text-base font-semibold"
              />

              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="p-4 border rounded-lg bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Milestone {index + 1}
                      </span>
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
                        <Label className="text-sm">Título</Label>
                        <Input
                          placeholder="Ex: Conclusão da Fase 1"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(milestone.id, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Data Prevista</Label>
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
                onClick={addMilestone}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Milestone
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar em Detalhamento"}
            </Button>
            
            <Button 
              className="flex-1"
              onClick={() => handleSubmit('review')}
              disabled={loading}
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Enviando..." : "Enviar para Aprovação"}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Dialog */}
        <UnsavedChangesDialog
          open={isBlocked}
          onConfirm={proceedNavigation}
          onCancel={cancelNavigation}
        />
      </div>
  );
};

export default CreateProject;

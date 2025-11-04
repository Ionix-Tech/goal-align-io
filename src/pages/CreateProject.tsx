import { useState, useEffect } from "react";
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
import { Plus, X, Users, Save, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [context, setContext] = useState("");
  const [strategicPillar, setStrategicPillar] = useState("");
  const [objective, setObjective] = useState("");
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);

  const strategicPillars = [
    { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
    { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
    { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
  ];

  // Proteção: apenas gestores PMO podem acessar
  useEffect(() => {
    if (role && role !== 'pmo_manager') {
      toast.error("Apenas gestores PMO podem criar projetos");
      navigate('/strategy');
    }
  }, [role, navigate]);

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

  const handleSubmit = async (targetStatus: 'draft' | 'review') => {
    // Validações básicas
    if (!projectName.trim()) {
      toast.error("Nome do projeto é obrigatório");
      return;
    }

    if (!context.trim()) {
      toast.error("Contexto é obrigatório");
      return;
    }

    // Validações para envio para aprovação
    if (targetStatus === 'review') {
      if (!strategicPillar) {
        toast.error("Pilar estratégico é obrigatório para enviar para aprovação");
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
    }

    setLoading(true);

    try {
      // 1. Salvar/atualizar projeto
      const projectData = {
        name: projectName,
        context: context,
        strategic_pillar: (strategicPillar || null) as 'operational_efficiency' | 'sales_expansion' | 'new_business' | null,
        objective: objective || null,
        status: targetStatus,
        assigned_to: user?.id,
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
      if (selectedMembers.length > 0) {
        // Deletar membros anteriores
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId);

        // Inserir novos
        const { error: membersError } = await supabase
          .from('project_members')
          .insert(
            selectedMembers.map(memberId => ({
              project_id: projectId,
              user_id: memberId,
              added_by: user?.id
            }))
          );

        if (membersError) throw membersError;
      }

      // Feedback de sucesso
      if (targetStatus === 'draft') {
        toast.success("Rascunho salvo", {
          description: "Você pode continuar editando depois"
        });
      } else {
        toast.success("Projeto enviado para aprovação", {
          description: "O CEO será notificado para revisar"
        });
        navigate('/strategy');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Erro ao salvar projeto");
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
        onClick={() => navigate('/strategy')}
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
              <Label htmlFor="projectName" className="text-base font-semibold">
                Nome do Projeto *
              </Label>
              <Input
                id="projectName"
                placeholder="Ex: Redução de Custos Operacionais"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-base"
              />
            </div>
          </Card>

          {/* Contexto */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="context" className="text-base font-semibold">
                Contexto *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Qual é o problema ou oportunidade que este projeto aborda?
              </p>
              <Textarea
                id="context"
                placeholder="Descreva o contexto, problema atual ou oportunidade..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
          </Card>

          {/* Pilar Estratégico */}
          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="pillar" className="text-base font-semibold">
                Pilar Estratégico *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                A qual pilar estratégico da empresa este projeto está alinhado?
              </p>
              <Select value={strategicPillar} onValueChange={setStrategicPillar}>
                <SelectTrigger id="pillar" className="text-base">
                  <SelectValue placeholder="Selecione o pilar estratégico" />
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
              <Label htmlFor="objective" className="text-base font-semibold">
                Objetivo *
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                O que você pretende alcançar com este projeto?
              </p>
              <Textarea
                id="objective"
                placeholder="Descreva o objetivo de forma clara e mensurável..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="min-h-[80px] text-base"
              />
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
              <div>
                <h3 className="text-base font-semibold mb-1">Indicadores</h3>
                <p className="text-sm text-muted-foreground">
                  Como você vai medir o sucesso? Defina como está hoje e onde quer chegar.
                </p>
              </div>

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
              <div>
                <h3 className="text-base font-semibold mb-1">Milestones Relevantes</h3>
                <p className="text-sm text-muted-foreground">
                  Marcos importantes do projeto e suas datas estimadas.
                </p>
              </div>

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
              {loading ? "Salvando..." : "Salvar Rascunho"}
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
      </div>
  );
};

export default CreateProject;

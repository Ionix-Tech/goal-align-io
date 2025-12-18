import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheses } from "@/hooks/useTheses";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { ActionPlanTaskManager, TaskInput } from "@/components/execution/ActionPlanTaskManager";
import { PROJECT_CATEGORIES } from "@/config/categories";

const actionPlanSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  thesis_id: z.string().optional(),
  what: z.string().min(1, "O quê é obrigatório"),
  why: z.string().min(1, "Por quê é obrigatório"),
  who: z.string().optional(),
  where_location: z.string().optional(),
  when_start: z.string().optional(),
  when_end: z.string().min(1, "Prazo final é obrigatório"),
  how_much: z.string().optional(),
});

type ActionPlanFormData = z.infer<typeof actionPlanSchema>;

const CreateActionPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: thesesData } = useTheses({});
  const { data: teamMembers } = useTeamMembers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<TaskInput[]>([]);

  const form = useForm<ActionPlanFormData>({
    resolver: zodResolver(actionPlanSchema),
    defaultValues: {
      name: "",
      category: "",
      thesis_id: "",
      what: "",
      why: "",
      who: "",
      where_location: "",
      when_start: "",
      when_end: "",
      how_much: "",
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: ActionPlanFormData) => {
      const insertData = {
        name: data.name,
        category: data.category as any,
        thesis_id: data.thesis_id || null,
        what: data.what,
        why: data.why,
        who: data.who || null,
        where_location: data.where_location || null,
        when_start: data.when_start || null,
        when_end: data.when_end,
        how: null,
        how_much: data.how_much || null,
        initiative_type: "action_plan" as const,
        status: "draft" as const,
        created_by: user?.id!,
      };

      const { data: plan, error: planError } = await supabase
        .from("projects")
        .insert([insertData])
        .select()
        .single();

      if (planError) throw planError;

      // Criar as tarefas associadas
      if (tasks.length > 0) {
        const taskInserts = tasks.map(task => ({
          project_id: plan.id,
          title: task.title,
          assigned_to: task.assigned_to || null,
          start_date: task.start_date || null,
          due_date: task.due_date || null,
          description: task.description || null,
          link_url: task.link_url || null,
          status: task.status || 'not_started',
          priority: 'medium',
          created_by: user?.id,
        }));

        const { error: tasksError } = await supabase
          .from('project_tasks')
          .insert(taskInserts);

        if (tasksError) throw tasksError;
      }

      return plan;
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      const taskCount = tasks.length;
      toast.success(`Plano de ação criado com ${taskCount} ${taskCount === 1 ? 'tarefa' : 'tarefas'}!`);
      navigate("/prioritization");
    },
    onError: (error) => {
      console.error("Erro ao criar plano:", error);
      toast.error("Erro ao criar plano de ação");
    },
  });

  const onSubmit = async (data: ActionPlanFormData) => {
    setIsSubmitting(true);
    try {
      await createPlanMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTheses = thesesData?.filter(t => t.is_active && !t.is_archived) || [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Novo Plano de Ação</h1>
              <p className="text-muted-foreground">
                Plano enxuto com 5W2H - Menos burocracia, mais agilidade
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Nome e objetivo vinculado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Reduzir tempo de setup em 30%" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thesis_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo Estratégico (Opcional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o objetivo ou deixe em branco" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem objetivo estratégico</SelectItem>
                          {activeTheses.map((thesis) => (
                            <SelectItem key={thesis.id} value={thesis.id}>
                              {thesis.name} - {thesis.objective}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5W2H - Planejamento Enxuto</CardTitle>
                <CardDescription>Preencha os campos essenciais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="what"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O quê? (What) *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="O que será feito?" 
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="why"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Por quê? (Why) *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Por que isso é importante?" 
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="who"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Líder de Projeto</FormLabel>
                        <FormControl>
                          <Input placeholder="Quem lidera este plano?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="where_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Onde? (Where)</FormLabel>
                        <FormControl>
                          <Input placeholder="Onde será executado?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="when_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quando começa? (When)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="when_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo Final? (When) *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Como? (How) - Tarefas do Plano</Label>
                  <ActionPlanTaskManager
                    tasks={tasks}
                    onTasksChange={setTasks}
                    members={teamMembers || []}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="how_much"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quanto? (How Much)</FormLabel>
                      <FormControl>
                        <Input placeholder="Quanto custa? (estimativa)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Plano de Ação"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateActionPlan;

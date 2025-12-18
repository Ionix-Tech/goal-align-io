import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Calendar, TrendingUp, Lightbulb, Briefcase, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useThesisDetails } from "@/hooks/useThesisDetails";
import { useThesisProjects } from "@/hooks/useThesisProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { ThesisInitiativeList } from "@/components/theses/ThesisInitiativeList";
import { THESIS_TEMPLATES } from "@/config/thesisTemplates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ThesisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useUserRole();
  
  const { data: thesis, isLoading: thesisLoading } = useThesisDetails(id);
  const { data: initiatives, isLoading: initiativesLoading } = useThesisProjects(id);

  const canManage = role === "ceo" || role === "pmo_manager";
  const template = thesis ? THESIS_TEMPLATES[thesis.thesis_type] || THESIS_TEMPLATES.custom : null;

  if (thesisLoading || initiativesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Objetivo estratégico não encontrado</p>
          <Button variant="link" onClick={() => navigate("/theses")}>
            Voltar para objetivos
          </Button>
        </div>
      </div>
    );
  }

  const ideasCount = initiatives?.ideas.length || 0;
  const projectsCount = initiatives?.projects.length || 0;
  const actionPlansCount = initiatives?.actionPlans.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/theses")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        {canManage && (
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {/* Thesis Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{template?.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: template?.color,
                    color: template?.color
                  }}
                >
                  {template?.name}
                </Badge>
                {thesis.is_archived && (
                  <Badge variant="secondary">Arquivada</Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{thesis.name}</CardTitle>
              <p className="text-muted-foreground">{thesis.objective}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(thesis.period_start), "dd MMM yyyy", { locale: ptBR })} - {format(new Date(thesis.period_end), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Section */}
      {thesis.kpis && thesis.kpis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              KPIs Estratégicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {thesis.kpis.map((kpi) => {
                const progress = kpi.target_value > 0 
                  ? Math.min(100, ((kpi.current_value || 0) / kpi.target_value) * 100)
                  : 0;
                
                return (
                  <Card key={kpi.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="font-medium mb-1">{kpi.name}</p>
                      {kpi.description && (
                        <p className="text-xs text-muted-foreground mb-2">{kpi.description}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">
                            {kpi.current_value ?? 0}{kpi.unit ? ` ${kpi.unit}` : ''}
                          </span>
                          <span className="text-muted-foreground">
                            / {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ''}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initiatives Tabs */}
      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ideas" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Ideias ({ideasCount})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Projetos ({projectsCount})
          </TabsTrigger>
          <TabsTrigger value="action_plans" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Planos de Ação ({actionPlansCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <ThesisInitiativeList 
            initiatives={initiatives?.ideas || []} 
            type="idea"
            emptyMessage="Nenhuma ideia vinculada a este objetivo"
          />
        </TabsContent>

        <TabsContent value="projects">
          <ThesisInitiativeList 
            initiatives={initiatives?.projects || []} 
            type="project"
            emptyMessage="Nenhum projeto vinculado a este objetivo"
          />
        </TabsContent>

        <TabsContent value="action_plans">
          <ThesisInitiativeList 
            initiatives={initiatives?.actionPlans || []} 
            type="action_plan"
            emptyMessage="Nenhum plano de ação vinculado a este objetivo"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

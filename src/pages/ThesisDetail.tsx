import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Calendar, TrendingUp, Lightbulb, Briefcase, Heart, Brain, Zap, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useThesisDetails, type ThesisKPI } from "@/hooks/useThesisDetails";
import { useThesisProjects } from "@/hooks/useThesisProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { useDeleteThesisKPI } from "@/hooks/useThesisKPIs";
import { usePillars } from "@/hooks/usePillars";
import { ThesisInitiativeList } from "@/components/theses/ThesisInitiativeList";
import { EditThesisDialog } from "@/components/theses/EditThesisDialog";
import { LinkInitiativeToThesisDialog } from "@/components/theses/LinkInitiativeToThesisDialog";
import { AddThesisKPIDialog } from "@/components/theses/AddThesisKPIDialog";
import { EditThesisKPIDialog } from "@/components/theses/EditThesisKPIDialog";
import { ThesisKPICard } from "@/components/theses/ThesisKPICard";
import { AddKPIMeasurementDialog } from "@/components/theses/AddKPIMeasurementDialog";
import { KPIMeasurementHistoryDialog } from "@/components/theses/KPIMeasurementHistoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Configuração visual baseada no tipo de pilar
const PILLAR_VISUAL_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  alma: { 
    icon: <Heart className="h-8 w-8" />, 
    color: "#e11d48", // rose-600
    label: "Engajamento" 
  },
  mente: { 
    icon: <Brain className="h-8 w-8" />, 
    color: "#7c3aed", // violet-600
    label: "Experiência" 
  },
  corpo: { 
    icon: <Zap className="h-8 w-8" />, 
    color: "#16a34a", // green-600
    label: "Resultado" 
  },
};

export default function ThesisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogType, setLinkDialogType] = useState<'idea' | 'project'>('idea');
  
  // KPI management states
  const [addKPIDialogOpen, setAddKPIDialogOpen] = useState(false);
  const [editKPIDialogOpen, setEditKPIDialogOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<ThesisKPI | null>(null);
  const [deleteKPIDialogOpen, setDeleteKPIDialogOpen] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<ThesisKPI | null>(null);
  
  // KPI Measurement states
  const [addMeasurementDialogOpen, setAddMeasurementDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [measurementKPI, setMeasurementKPI] = useState<ThesisKPI | null>(null);
  
  const deleteKPI = useDeleteThesisKPI();
  
  const { data: thesis, isLoading: thesisLoading } = useThesisDetails(id);
  const { data: initiatives, isLoading: initiativesLoading } = useThesisProjects(id);
  const { data: pillars = [] } = usePillars();

  const canManage = role === "ceo" || role === "pmo_manager";

  // Mutation para desvincular iniciativa
  const unlinkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ thesis_id: null })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis-projects", id] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-projects"] });
      toast.success("Iniciativa desvinculada");
    },
    onError: () => {
      toast.error("Erro ao desvincular");
    },
  });

  const handleLinkClick = (type: 'idea' | 'project') => {
    setLinkDialogType(type);
    setLinkDialogOpen(true);
  };

  const handleEditKPI = (kpi: ThesisKPI) => {
    setSelectedKPI(kpi);
    setEditKPIDialogOpen(true);
  };

  const handleDeleteKPIClick = (kpi: ThesisKPI) => {
    setKpiToDelete(kpi);
    setDeleteKPIDialogOpen(true);
  };

  const confirmDeleteKPI = async () => {
    if (!kpiToDelete) return;
    await deleteKPI.mutateAsync({ id: kpiToDelete.id, thesis_id: kpiToDelete.thesis_id });
    setDeleteKPIDialogOpen(false);
    setKpiToDelete(null);
  };

  const handleAddMeasurement = (kpi: ThesisKPI) => {
    setMeasurementKPI(kpi);
    setAddMeasurementDialogOpen(true);
  };

  const handleViewHistory = (kpi: ThesisKPI) => {
    setMeasurementKPI(kpi);
    setHistoryDialogOpen(true);
  };

  // Get pillar info for the thesis
  const pillar = pillars.find(p => p.id === (thesis as any)?.pillar_id);
  
  // Configuração visual baseada no pilar
  const config = pillar 
    ? PILLAR_VISUAL_CONFIG[pillar.pillar_type] || { 
        icon: <Zap className="h-8 w-8" />, 
        color: "#6b7280", 
        label: "Objetivo" 
      }
    : { 
        icon: <Zap className="h-8 w-8" />, 
        color: "#6b7280", 
        label: "Objetivo" 
      };

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

  return (
    <AppLayout
      customBreadcrumbs={[
        { label: "Estratégia" },
        { label: "Objetivos", href: "/theses" },
        { label: thesis.name }
      ]}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/theses")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        
        {canManage && (
          <Button variant="outline" className="gap-2" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      {/* Thesis Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <span style={{ color: config?.color }}>{config?.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {pillar && (
                  <Badge 
                    variant="outline" 
                    style={{ 
                      borderColor: config?.color,
                      color: config?.color
                    }}
                  >
                    {pillar.name}
                  </Badge>
                )}
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              KPIs Estratégicos
            </CardTitle>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setAddKPIDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Adicionar KPI
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {thesis.kpis && thesis.kpis.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {thesis.kpis.map((kpi) => (
                <ThesisKPICard
                  key={kpi.id}
                  kpi={kpi}
                  canManage={canManage}
                  onEdit={handleEditKPI}
                  onDelete={handleDeleteKPIClick}
                  onAddMeasurement={handleAddMeasurement}
                  onViewHistory={handleViewHistory}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum KPI definido para este objetivo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Initiatives Tabs */}
      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ideas" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Ideias ({ideasCount})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Projetos ({projectsCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <ThesisInitiativeList
            initiatives={initiatives?.ideas || []}
            type="idea"
            emptyMessage="Nenhuma ideia vinculada a este objetivo"
            canManage={canManage}
            onLinkClick={() => handleLinkClick('idea')}
            onUnlink={(projectId) => unlinkMutation.mutate(projectId)}
          />
        </TabsContent>

        <TabsContent value="projects">
          <ThesisInitiativeList
            initiatives={initiatives?.projects || []}
            type="project"
            emptyMessage="Nenhum projeto vinculado a este objetivo"
            canManage={canManage}
            onLinkClick={() => handleLinkClick('project')}
            onUnlink={(projectId) => unlinkMutation.mutate(projectId)}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditThesisDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        thesis={thesis}
      />

      {/* Link Initiative Dialog */}
      {thesis && (
        <LinkInitiativeToThesisDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          thesisId={thesis.id}
          thesisName={thesis.name}
          defaultTab={linkDialogType}
        />
      )}

      {/* KPI Dialogs */}
      {thesis && (
        <>
          <AddThesisKPIDialog
            open={addKPIDialogOpen}
            onOpenChange={setAddKPIDialogOpen}
            thesisId={thesis.id}
          />
          <EditThesisKPIDialog
            open={editKPIDialogOpen}
            onOpenChange={setEditKPIDialogOpen}
            kpi={selectedKPI}
          />
          <AlertDialog open={deleteKPIDialogOpen} onOpenChange={setDeleteKPIDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir KPI</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o KPI "{kpiToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteKPI}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* KPI Measurement Dialogs */}
          <AddKPIMeasurementDialog
            open={addMeasurementDialogOpen}
            onOpenChange={setAddMeasurementDialogOpen}
            kpi={measurementKPI}
          />
          <KPIMeasurementHistoryDialog
            open={historyDialogOpen}
            onOpenChange={setHistoryDialogOpen}
            kpi={measurementKPI}
          />
        </>
      )}
      </div>
    </AppLayout>
  );
}

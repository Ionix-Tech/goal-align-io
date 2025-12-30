import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Brain, Zap } from "lucide-react";
import { useTheses, useUpdateThesis, useDeleteThesis, type Thesis } from "@/hooks/useTheses";
import { usePillars } from "@/hooks/usePillars";
import { ThesisCard } from "@/components/theses/ThesisCard";
import { CreateThesisDialog } from "@/components/theses/CreateThesisDialog";
import { EditThesisDialog } from "@/components/theses/EditThesisDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  corpo: <Zap className="h-5 w-5 text-green-600" />,
  alma: <Heart className="h-5 w-5 text-rose-600" />,
  mente: <Brain className="h-5 w-5 text-violet-600" />,
};

const PILLAR_COLORS: Record<string, string> = {
  corpo: "border-green-200 bg-green-50/50",
  alma: "border-rose-200 bg-rose-50/50",
  mente: "border-violet-200 bg-violet-50/50",
};

export default function Theses() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  // Default to next year since product focus is future planning
  const nextYear = new Date().getFullYear() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(nextYear);
  const { role, loading: roleLoading } = useUserRole();

  const { data: theses, isLoading } = useTheses({ 
    year: selectedYear
  });
  const { data: pillars = [], isLoading: pillarsLoading } = usePillars();
  const updateThesis = useUpdateThesis();
  const deleteThesis = useDeleteThesis();

  const canManageTheses = role === "ceo" || role === "pmo_manager";

  // Dynamic year list: current year -1, current, +1, +2
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const handleEdit = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setEditDialogOpen(true);
  };

  const handleArchiveClick = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setArchiveDialogOpen(true);
  };

  const handleDeleteClick = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setDeleteDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!selectedThesis) return;
    try {
      await updateThesis.mutateAsync({ 
        id: selectedThesis.id, 
        is_archived: true 
      });
      toast.success("Objetivo arquivado com sucesso");
    } catch (error) {
      toast.error("Erro ao arquivar objetivo");
    }
    setArchiveDialogOpen(false);
    setSelectedThesis(null);
  };

  const confirmDelete = async () => {
    if (!selectedThesis) return;
    try {
      await deleteThesis.mutateAsync(selectedThesis.id);
      toast.success("Objetivo excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir objetivo. Verifique se não há projetos vinculados.");
    }
    setDeleteDialogOpen(false);
    setSelectedThesis(null);
  };

  // Group theses by pillar
  const thesesByPillar = pillars.map(pillar => ({
    pillar,
    theses: (theses || []).filter(t => (t as any).pillar_id === pillar.id)
  }));

  // Also get unlinked theses (those without pillar_id)
  const unlinkedTheses = (theses || []).filter(t => !(t as any).pillar_id);

  if (isLoading || roleLoading || pillarsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Objetivos Estratégicos</h1>
          <p className="text-muted-foreground">
            Gerencie os objetivos macro e KPIs estratégicos da organização
          </p>
        </div>

        {canManageTheses && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Objetivo
          </Button>
        )}
      </div>

      {/* Filtro de Ano */}
      <div className="flex gap-4">
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Objetivos agrupados por Pilar */}
      {thesesByPillar.map(({ pillar, theses: pillarTheses }) => (
        <div key={pillar.id} className={`rounded-lg border p-4 ${PILLAR_COLORS[pillar.pillar_type]}`}>
          <div className="flex items-center gap-2 mb-4">
            {PILLAR_ICONS[pillar.pillar_type]}
            <h2 className="text-lg font-semibold">{pillar.name}</h2>
            <span className="text-sm text-muted-foreground">
              ({pillarTheses.length} objetivo{pillarTheses.length !== 1 ? 's' : ''})
            </span>
          </div>
          
          {pillarTheses.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum objetivo para este pilar em {selectedYear}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pillarTheses.map((thesis) => (
                <ThesisCard
                  key={thesis.id}
                  thesis={thesis}
                  onClick={(t) => navigate(`/theses/${t.id}`)}
                  onEdit={canManageTheses ? () => handleEdit(thesis) : undefined}
                  onArchive={canManageTheses ? () => handleArchiveClick(thesis) : undefined}
                  onDelete={canManageTheses ? () => handleDeleteClick(thesis) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Objetivos sem pilar (legado) */}
      {unlinkedTheses.length > 0 && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-muted-foreground">Sem Pilar Vinculado</h2>
            <span className="text-sm text-muted-foreground">
              ({unlinkedTheses.length} objetivo{unlinkedTheses.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unlinkedTheses.map((thesis) => (
              <ThesisCard
                key={thesis.id}
                thesis={thesis}
                onClick={(t) => navigate(`/theses/${t.id}`)}
                onEdit={canManageTheses ? () => handleEdit(thesis) : undefined}
                onArchive={canManageTheses ? () => handleArchiveClick(thesis) : undefined}
                onDelete={canManageTheses ? () => handleDeleteClick(thesis) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!theses || theses.length === 0) && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-muted-foreground mb-4">
            Nenhum objetivo estratégico encontrado para {selectedYear}
          </div>
          {canManageTheses && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Objetivo
            </Button>
          )}
        </div>
      )}

      <CreateThesisDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditThesisDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        thesis={selectedThesis}
      />

      {/* Dialog de confirmação de arquivamento */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar objetivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o objetivo "{selectedThesis?.name}"? 
              Objetivos arquivados não aparecem na lista principal, mas podem ser restaurados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir objetivo permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o objetivo "{selectedThesis?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

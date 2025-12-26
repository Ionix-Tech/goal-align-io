import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTheses, type Thesis } from "@/hooks/useTheses";
import { ThesisCard } from "@/components/theses/ThesisCard";
import { CreateThesisDialog } from "@/components/theses/CreateThesisDialog";
import { EditThesisDialog } from "@/components/theses/EditThesisDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

export default function Theses() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  // Default to next year since product focus is future planning
  const nextYear = new Date().getFullYear() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(nextYear);
  const { role, loading: roleLoading } = useUserRole();

  const { data: theses, isLoading } = useTheses({ 
    year: selectedYear
  });

  const canManageTheses = role === "ceo" || role === "pmo_manager";

  // Dynamic year list: current year -1, current, +1, +2
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const handleEdit = (thesis: Thesis) => {
    setSelectedThesis(thesis);
    setEditDialogOpen(true);
  };

  if (isLoading || roleLoading) {
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

      {/* Lista de Objetivos */}
      {!theses || theses.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {theses.map((thesis) => (
            <ThesisCard
              key={thesis.id}
              thesis={thesis}
              onClick={(t) => navigate(`/theses/${t.id}`)}
              onEdit={canManageTheses ? () => handleEdit(thesis) : undefined}
              onArchive={canManageTheses ? () => {} : undefined}
            />
          ))}
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
    </div>
  );
}

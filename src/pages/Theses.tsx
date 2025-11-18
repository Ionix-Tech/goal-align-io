import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { useTheses } from "@/hooks/useTheses";
import { useThesisDetails } from "@/hooks/useThesisDetails";
import { ThesisCard } from "@/components/theses/ThesisCard";
import { CreateThesisDialog } from "@/components/theses/CreateThesisDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THESIS_TEMPLATES } from "@/config/thesisTemplates";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

export default function Theses() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState<string>("all");
  const { role, loading: roleLoading } = useUserRole();

  const { data: theses, isLoading } = useTheses({ 
    year: selectedYear,
    type: selectedType === "all" ? undefined : selectedType as any
  });

  const canManageTheses = role === "ceo" || role === "pmo_manager";

  const years = [2024, 2025, 2026];

  const groupedTheses = theses?.reduce((acc, thesis) => {
    const type = thesis.thesis_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(thesis);
    return acc;
  }, {} as Record<string, typeof theses>);

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
          <h1 className="text-3xl font-bold">Teses Estratégicas</h1>
          <p className="text-muted-foreground">
            Gerencie os objetivos macro e KPIs estratégicos da organização
          </p>
        </div>

        {canManageTheses && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tese
          </Button>
        )}
      </div>

      {/* Filtros */}
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

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-64">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(THESIS_TEMPLATES).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                {template.icon} {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Teses */}
      {!theses || theses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-muted-foreground mb-4">
            Nenhuma tese estratégica encontrada para {selectedYear}
          </div>
          {canManageTheses && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Tese
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue={Object.keys(groupedTheses || {})[0]} className="space-y-4">
          <TabsList>
            {Object.entries(THESIS_TEMPLATES).map(([key, template]) => {
              const count = groupedTheses?.[key]?.length || 0;
              if (selectedType !== "all" && selectedType !== key) return null;
              return (
                <TabsTrigger key={key} value={key} disabled={count === 0}>
                  {template.icon} {template.name} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.keys(THESIS_TEMPLATES).map((type) => (
            <TabsContent key={type} value={type}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedTheses?.[type]?.map((thesis) => (
                  <ThesisCard
                    key={thesis.id}
                    thesis={thesis}
                    onEdit={canManageTheses ? () => {} : undefined}
                    onArchive={canManageTheses ? () => {} : undefined}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <CreateThesisDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

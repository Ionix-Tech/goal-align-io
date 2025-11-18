import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { useTheses } from "@/hooks/useTheses";

type StrategicPillar = Database['public']['Enums']['strategic_pillar'];
type InitiativeType = Database['public']['Enums']['initiative_type'];

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPillar: StrategicPillar | null;
  onPillarChange: (pillar: StrategicPillar | null) => void;
  selectedThesis?: string | null;
  onThesisChange?: (thesisId: string | null) => void;
  selectedType?: InitiativeType | null;
  onTypeChange?: (type: InitiativeType | null) => void;
}

const PILLARS: Array<{ value: StrategicPillar; label: string; icon: string }> = [
  { value: 'operational_efficiency', label: 'Eficiência Operacional', icon: '⚙️' },
  { value: 'sales_expansion', label: 'Expansão de Vendas', icon: '📈' },
  { value: 'new_business', label: 'Novos Negócios', icon: '🚀' }
];

export function ProjectFilters({ 
  search, 
  onSearchChange, 
  selectedPillar, 
  onPillarChange,
  selectedThesis,
  onThesisChange,
  selectedType,
  onTypeChange
}: ProjectFiltersProps) {
  const { data: theses } = useTheses({ year: new Date().getFullYear() });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Thesis filter */}
        {onThesisChange && (
          <Select value={selectedThesis || "all"} onValueChange={(v) => onThesisChange(v === "all" ? null : v)}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por tese" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as teses</SelectItem>
              {theses?.map(thesis => (
                <SelectItem key={thesis.id} value={thesis.id}>
                  {thesis.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Pillar filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedPillar === null ? "default" : "outline"}
            size="sm"
            onClick={() => onPillarChange(null)}
          >
            Todos
          </Button>
          
          {PILLARS.map((pillar) => (
            <Button
              key={pillar.value}
              variant={selectedPillar === pillar.value ? "default" : "outline"}
              size="sm"
              onClick={() => onPillarChange(pillar.value)}
              className="gap-1"
            >
              <span>{pillar.icon}</span>
              {pillar.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Active filters */}
      {(search || selectedPillar || selectedThesis) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {search}
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-muted rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedThesis && onThesisChange && (
            <Badge variant="secondary" className="gap-1">
              Tese: {theses?.find(t => t.id === selectedThesis)?.name}
              <button
                onClick={() => onThesisChange(null)}
                className="ml-1 hover:bg-muted rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedPillar && (
            <Badge variant="secondary" className="gap-1">
              {PILLARS.find(p => p.value === selectedPillar)?.label}
              <button
                onClick={() => onPillarChange(null)}
                className="ml-1 hover:bg-muted rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Type filter */}
      {onTypeChange && (
        <div className="flex-1 min-w-[200px]">
          <Select
            value={selectedType || "all"}
            onValueChange={(value) => onTypeChange(value === "all" ? null : value as InitiativeType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="idea">💡 Ideias</SelectItem>
              <SelectItem value="project">📋 Projetos</SelectItem>
              <SelectItem value="action_plan">⚡ Planos de Ação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

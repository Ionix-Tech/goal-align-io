import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type StrategicPillar = Database['public']['Enums']['strategic_pillar'];

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPillar: StrategicPillar | null;
  onPillarChange: (pillar: StrategicPillar | null) => void;
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
  onPillarChange 
}: ProjectFiltersProps) {
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

      {/* Active filters */}
      {(search || selectedPillar) && (
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
    </div>
  );
}

import { KPIFilters, KPIType } from '@/hooks/useKPIs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface KPIFiltersBarProps {
  filters: KPIFilters;
  onFiltersChange: (filters: KPIFilters) => void;
  pillars: { id: string; name: string }[];
  theses: { id: string; name: string; pillar_id?: string | null }[];
  areas: { id: string; name: string }[];
  teamMembers: { id: string; full_name: string }[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function KPIFiltersBar({
  filters,
  onFiltersChange,
  pillars,
  theses,
  areas,
  teamMembers
}: KPIFiltersBarProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const hasActiveFilters = filters.kpi_type || filters.pillar_id || filters.objective_id || filters.area_id || filters.owner_id;

  const clearFilters = () => {
    onFiltersChange({ year: filters.year });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-lg border">
      {/* Year Filter */}
      <Select
        value={filters.year?.toString() || currentYear.toString()}
        onValueChange={(value) => onFiltersChange({ ...filters, year: parseInt(value) })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map(year => (
            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* KPI Type Filter */}
      <Select
        value={filters.kpi_type || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          kpi_type: value === 'all' ? undefined : value as KPIType 
        })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="strategic">Estratégico</SelectItem>
          <SelectItem value="area">Área</SelectItem>
          <SelectItem value="control">Controle</SelectItem>
        </SelectContent>
      </Select>

      {/* Pillar Filter */}
      <Select
        value={filters.pillar_id || 'all'}
        onValueChange={(value) => onFiltersChange({
          ...filters,
          pillar_id: value === 'all' ? undefined : value,
          objective_id: undefined
        })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os pilares</SelectItem>
          {pillars.map(pillar => (
            <SelectItem key={pillar.id} value={pillar.id}>{pillar.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Objective Filter */}
      <Select
        value={filters.objective_id || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          objective_id: value === 'all' ? undefined : value 
        })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Objetivo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os objetivos</SelectItem>
          {theses
            .filter(t => !filters.pillar_id || t.pillar_id === filters.pillar_id)
            .map(thesis => (
              <SelectItem key={thesis.id} value={thesis.id}>{thesis.name}</SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Area Filter */}
      <Select
        value={filters.area_id || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          area_id: value === 'all' ? undefined : value 
        })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as áreas</SelectItem>
          {areas.map(area => (
            <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Owner Filter */}
      <Select
        value={filters.owner_id || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          owner_id: value === 'all' ? undefined : value 
        })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os responsáveis</SelectItem>
          {teamMembers.map(member => (
            <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

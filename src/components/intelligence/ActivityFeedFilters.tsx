import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ActivityFeedFilters as Filters } from "@/hooks/useActivityFeed";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActivityFeedFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function ActivityFeedFilters({ filters, onFiltersChange }: ActivityFeedFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Fetch approved/in-progress projects
  const { data: projects } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .in('status', ['approved', 'completed'])
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch active theses
  const { data: theses } = useQuery({
    queryKey: ['theses-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_theses')
        .select('id, name')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomDates(true);
      onFiltersChange({ ...filters, period: 'custom' });
    } else {
      setShowCustomDates(false);
      onFiltersChange({ 
        ...filters, 
        period: value as Filters['period'],
        startDate: undefined,
        endDate: undefined
      });
    }
  };

  const handleClearFilters = () => {
    setShowCustomDates(false);
    onFiltersChange({
      period: 'week',
      activityType: 'all'
    });
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card border border-border rounded-lg">
      {/* Period Filter */}
      <div className="flex-1 min-w-[140px]">
        <Select value={filters.period} onValueChange={handlePeriodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
            <SelectItem value="quarter">Últimos 3 meses</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Pickers */}
      {showCustomDates && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(new Date(filters.startDate), "PPP", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate ? new Date(filters.startDate) : undefined}
                onSelect={(date) => onFiltersChange({ ...filters, startDate: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(new Date(filters.endDate), "PPP", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate ? new Date(filters.endDate) : undefined}
                onSelect={(date) => onFiltersChange({ ...filters, endDate: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Activity Type Filter */}
      <div className="flex-1 min-w-[140px]">
        <Select 
          value={filters.activityType} 
          onValueChange={(value) => onFiltersChange({ ...filters, activityType: value as Filters['activityType'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo de atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="indicator">Indicadores</SelectItem>
            <SelectItem value="milestone">Milestones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Filter */}
      <div className="flex-1 min-w-[180px]">
        <Select 
          value={filters.projectId || 'all'} 
          onValueChange={(value) => onFiltersChange({ ...filters, projectId: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os projetos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Thesis Filter */}
      <div className="flex-1 min-w-[180px]">
        <Select 
          value={filters.thesisId || 'all'} 
          onValueChange={(value) => onFiltersChange({ ...filters, thesisId: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as teses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as teses</SelectItem>
            {theses?.map((thesis) => (
              <SelectItem key={thesis.id} value={thesis.id}>
                {thesis.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleClearFilters}
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

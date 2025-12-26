import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { useTheses } from "@/hooks/useTheses";
import { THESIS_TEMPLATES } from "@/config/thesisTemplates";
import { PROJECT_CATEGORIES, ProjectCategory } from "@/config/categories";

type InitiativeType = Database['public']['Enums']['initiative_type'];

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedThesis?: string | null;
  onThesisChange?: (thesisId: string | null) => void;
  selectedType?: InitiativeType | null;
  onTypeChange?: (type: InitiativeType | null) => void;
  selectedCategory?: ProjectCategory | null;
  onCategoryChange?: (category: ProjectCategory | null) => void;
}

export function ProjectFilters({ 
  search, 
  onSearchChange, 
  selectedThesis,
  onThesisChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange
}: ProjectFiltersProps) {
  // Fetch theses for next year since product focus is future planning
  const nextYear = new Date().getFullYear() + 1;
  const { data: theses } = useTheses({ year: nextYear });

  const getThesisIcon = (thesisType: keyof typeof THESIS_TEMPLATES) => {
    return THESIS_TEMPLATES[thesisType]?.icon || '📋';
  };

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

      {/* Thesis filter buttons */}
      {onThesisChange && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedThesis === null ? "default" : "outline"}
            size="sm"
            onClick={() => onThesisChange(null)}
          >
            Todos
          </Button>
          
          {theses?.map((thesis) => (
            <Button
              key={thesis.id}
              variant={selectedThesis === thesis.id ? "default" : "outline"}
              size="sm"
              onClick={() => onThesisChange(thesis.id)}
              className="gap-1"
            >
              <span>{getThesisIcon(thesis.thesis_type)}</span>
              {thesis.name}
            </Button>
          ))}
        </div>
      )}

      {/* Active filters */}
      {(search || selectedThesis || selectedCategory) && (
        <div className="flex items-center gap-2 flex-wrap">
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
              Objetivo: {theses?.find(t => t.id === selectedThesis)?.name}
              <button
                onClick={() => onThesisChange(null)}
                className="ml-1 hover:bg-muted rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedCategory && onCategoryChange && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {PROJECT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              <button
                onClick={() => onCategoryChange(null)}
                className="ml-1 hover:bg-muted rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Category and Type filters */}
      <div className="flex flex-wrap gap-4">
        {/* Category filter */}
        {onCategoryChange && (
          <div className="min-w-[200px]">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => onCategoryChange(value === "all" ? null : value as ProjectCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
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
          </div>
        )}

        {/* Type filter */}
        {onTypeChange && (
          <div className="min-w-[200px]">
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
    </div>
  );
}

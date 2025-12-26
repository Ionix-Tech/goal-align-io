import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Briefcase, Edit, Archive, Heart, Brain, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Thesis } from "@/hooks/useTheses";

// Configuração visual baseada no nome do objetivo
const THESIS_VISUAL_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  ALMA: { 
    icon: <Heart className="h-6 w-6" />, 
    color: "#e11d48", // rose-600
    label: "Engajamento" 
  },
  MENTE: { 
    icon: <Brain className="h-6 w-6" />, 
    color: "#7c3aed", // violet-600
    label: "Experiência" 
  },
  CORPO: { 
    icon: <Zap className="h-6 w-6" />, 
    color: "#16a34a", // green-600
    label: "Resultado" 
  },
};

interface ThesisCardProps {
  thesis: Thesis & { project_count?: number; kpi_count?: number };
  onEdit?: (thesis: Thesis) => void;
  onArchive?: (thesis: Thesis) => void;
  onClick?: (thesis: Thesis) => void;
}

export function ThesisCard({ thesis, onEdit, onArchive, onClick }: ThesisCardProps) {
  const config = THESIS_VISUAL_CONFIG[thesis.name.toUpperCase()] || { 
    icon: <Zap className="h-6 w-6" />, 
    color: "#6b7280", 
    label: "Objetivo" 
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(thesis)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: config.color }}>{config.icon}</span>
              <Badge 
                variant="outline" 
                style={{ 
                  borderColor: config.color,
                  color: config.color
                }}
              >
                {config.label}
              </Badge>
              {thesis.is_archived && (
                <Badge variant="secondary">Arquivada</Badge>
              )}
            </div>
            <CardTitle className="text-xl">{thesis.name}</CardTitle>
            <CardDescription className="mt-1">{thesis.objective}</CardDescription>
          </div>
          
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(thesis)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onArchive && !thesis.is_archived && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onArchive(thesis)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(thesis.period_start), "dd MMM yyyy", { locale: ptBR })} - {format(new Date(thesis.period_end), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{thesis.kpi_count || 0}</span>
              <span className="text-muted-foreground">KPIs</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{thesis.project_count || 0}</span>
              <span className="text-muted-foreground">Projetos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

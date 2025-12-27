import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Lightbulb } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { THESIS_TYPE_COLORS } from "@/config/thesisTemplates";
import { getCategoryConfig } from "@/config/categories";

type StrategicPillar = Database['public']['Enums']['strategic_pillar'];
type ProjectCategory = Database['public']['Enums']['project_category'];

interface KanbanCardProps {
  project: {
    id: string;
    name: string;
    strategic_pillar: StrategicPillar | null;
    category?: ProjectCategory | null;
    updated_at: string | null;
    initiative_type?: string;
    assigned_to_profile?: {
      full_name: string;
      avatar_url: string | null;
    };
    thesis?: {
      id: string;
      name: string;
      thesis_type: string;
    } | null;
    indicators: Array<{ id: string }>;
    milestones: Array<{ id: string; completed: boolean | null }>;
  };
  onClick?: () => void;
  className?: string;
  isDragging?: boolean;
}

const PILLAR_CONFIG: Record<StrategicPillar, { label: string; color: string }> = {
  operational_efficiency: { label: 'Eficiência', color: 'bg-blue-100 text-blue-800' },
  sales_expansion: { label: 'Vendas', color: 'bg-green-100 text-green-800' },
  new_business: { label: 'Novos Negócios', color: 'bg-purple-100 text-purple-800' }
};

export function KanbanCard({ project, onClick, className, isDragging }: KanbanCardProps) {
  const completedIndicators = project.indicators?.length || 0;
  const totalIndicators = completedIndicators;
  
  const completedMilestones = project.milestones?.filter(m => m.completed).length || 0;
  const totalMilestones = project.milestones?.length || 0;

  const pillarConfig = project.strategic_pillar ? PILLAR_CONFIG[project.strategic_pillar] : null;
  const categoryConfig = getCategoryConfig(project.category);

  const getInitiativeTypeInfo = () => {
    switch (project.initiative_type) {
      case 'idea':
        return { icon: Lightbulb, label: 'Ideia', variant: 'outline' as const, className: 'text-yellow-600 bg-yellow-500/10' };
      case 'project':
      case 'action_plan': // Legado: tratado como projeto
      default:
        return { icon: FileText, label: 'Projeto', variant: 'default' as const, className: 'text-blue-600 bg-blue-500/10' };
    }
  };

  const typeInfo = getInitiativeTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 rotate-2",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Nome e tipo */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2 leading-snug flex-1">
            {project.name}
          </h4>
          <Badge variant={typeInfo.variant} className={cn("text-xs shrink-0", typeInfo.className)}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeInfo.label}
          </Badge>
        </div>

        {/* Categoria e tipo */}
        <div className="flex flex-wrap gap-2">
          {categoryConfig && (
            <Badge variant="outline" className={cn("text-xs", categoryConfig.colorClass)}>
              <categoryConfig.icon className="h-3 w-3 mr-1" />
              {categoryConfig.label}
            </Badge>
          )}
          {project.thesis && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                borderColor: THESIS_TYPE_COLORS[project.thesis.thesis_type],
                color: THESIS_TYPE_COLORS[project.thesis.thesis_type]
              }}
            >
              {project.thesis.name}
            </Badge>
          )}
          {pillarConfig && (
            <Badge variant="outline" className={cn("text-xs", pillarConfig.color)}>
              {pillarConfig.label}
            </Badge>
          )}
        </div>

        {/* Progresso */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>📊 {completedIndicators}/{totalIndicators}</span>
          <span>🎯 {completedMilestones}/{totalMilestones}</span>
        </div>

        {/* Gestor e data */}
        <div className="flex items-center justify-between pt-2 border-t">
          {project.assigned_to_profile ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.assigned_to_profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {project.assigned_to_profile.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                {project.assigned_to_profile.full_name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Não atribuído</span>
          )}

          {project.updated_at && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(project.updated_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

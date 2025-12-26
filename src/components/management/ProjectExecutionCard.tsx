import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, FileText, ClipboardList } from "lucide-react";
import type { ApprovedProject } from "@/hooks/useApprovedProjects";

const PILLAR_CONFIG = {
  operational_efficiency: { label: 'Eficiência', color: 'bg-blue-100 text-blue-800', icon: '⚙️' },
  sales_expansion: { label: 'Vendas', color: 'bg-green-100 text-green-800', icon: '📈' },
  new_business: { label: 'Novos Negócios', color: 'bg-purple-100 text-purple-800', icon: '🚀' }
};

const INITIATIVE_TYPE_CONFIG = {
  project: { 
    label: 'Projeto', 
    className: 'bg-blue-500/10 text-blue-700 border-blue-200',
    icon: FileText
  },
  action_plan: { 
    label: 'Plano de Ação', 
    className: 'bg-violet-500/10 text-violet-700 border-violet-200',
    icon: ClipboardList
  },
  idea: { 
    label: 'Ideia', 
    className: 'bg-amber-500/10 text-amber-700 border-amber-200',
    icon: FileText
  }
};

interface ProjectExecutionCardProps {
  project: ApprovedProject;
  onClick?: () => void;
}

export function ProjectExecutionCard({ project, onClick }: ProjectExecutionCardProps) {
  const pillarConfig = project.strategic_pillar ? PILLAR_CONFIG[project.strategic_pillar] : null;
  const initiativeConfig = INITIATIVE_TYPE_CONFIG[project.initiative_type] || INITIATIVE_TYPE_CONFIG.project;
  const InitiativeIcon = initiativeConfig.icon;
  const progressPercentage = project.milestones_total > 0
    ? Math.round((project.milestones_completed / project.milestones_total) * 100)
    : 0;

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Initiative Type Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={initiativeConfig.className}>
            <InitiativeIcon className="h-3 w-3 mr-1" />
            {initiativeConfig.label}
          </Badge>
          <HealthStatusBadge status={project.current_health} size="md" />
        </div>

        {/* Header */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">
            {project.name}
          </h3>
          {pillarConfig && (
            <Badge variant="outline" className={pillarConfig.color}>
              <span className="mr-1">{pillarConfig.icon}</span>
              {pillarConfig.label}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso de Milestones</span>
            <span className="font-medium">{project.milestones_completed}/{project.milestones_total}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>📊 {project.indicators_count} indicadores</span>
          <span>🎯 {project.milestones_total} milestones</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          {project.assigned_to_profile ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.assigned_to_profile.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {project.assigned_to_profile.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {project.assigned_to_profile.full_name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sem gestor</span>
          )}

          {project.last_update && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(project.last_update), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

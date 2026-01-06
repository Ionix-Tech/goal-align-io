import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HealthStatusBadge } from "./HealthStatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, FileText, ClipboardList, Flame, MoreVertical, ExternalLink, FileEdit, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const pillarConfig = project.strategic_pillar ? PILLAR_CONFIG[project.strategic_pillar] : null;
  const initiativeConfig = INITIATIVE_TYPE_CONFIG[project.initiative_type] || INITIATIVE_TYPE_CONFIG.project;
  const InitiativeIcon = initiativeConfig.icon;
  const progressPercentage = project.milestones_total > 0
    ? Math.round((project.milestones_completed / project.milestones_total) * 100)
    : 0;

  const handleOpenExecution = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/management/${project.id}`);
  };

  const handleViewA3 = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}`);
  };

  const handleEditA3 = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}/a3`);
  };

  const handleExportReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to project page with print param
    navigate(`/management/${project.id}?print=true`);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Initiative Type Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={initiativeConfig.className}>
              <InitiativeIcon className="h-3 w-3 mr-1" />
              {initiativeConfig.label}
            </Badge>
            {project.is_critical && (
              project.critical_reason ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Badge variant="destructive" className="gap-1 px-1.5 cursor-help">
                      <Flame className="h-3 w-3" />
                      <span className="sr-only sm:not-sr-only">Crítico</span>
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" side="top">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Flame className="h-4 w-4 text-destructive" />
                        Projeto Crítico
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {project.critical_reason}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <Badge variant="destructive" className="gap-1 px-1.5">
                  <Flame className="h-3 w-3" />
                  <span className="sr-only sm:not-sr-only">Crítico</span>
                </Badge>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <HealthStatusBadge status={project.current_health} size="md" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpenExecution}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Execução
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewA3}>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver A3
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditA3}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Editar A3
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportReport}>
                  <Printer className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

import { ActivityFeedItem, ActivityType } from "@/hooks/useActivityFeed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  Target, 
  CheckCircle2, 
  Calendar, 
  CalendarClock, 
  AlertTriangle, 
  MessageSquare, 
  Heart, 
  Paperclip,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ActivityTimelineCardProps {
  activity: ActivityFeedItem;
  isFirst: boolean;
  isLast: boolean;
}

const activityConfig: Record<ActivityType, { 
  icon: any; 
  bgColor: string; 
  iconColor: string;
  label: string;
}> = {
  indicator: {
    icon: BarChart3,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Indicador"
  },
  milestone: {
    icon: Target,
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    label: "Marco"
  },
  task_status: {
    icon: CheckCircle2,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    label: "Status de Tarefa"
  },
  task_date: {
    icon: Calendar,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    label: "Data de Tarefa"
  },
  milestone_date: {
    icon: CalendarClock,
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "Data de Marco"
  },
  situation: {
    icon: AlertTriangle,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    label: "Situação"
  },
  comment: {
    icon: MessageSquare,
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    iconColor: "text-gray-600 dark:text-gray-400",
    label: "Comentário"
  },
  health: {
    icon: Heart,
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    label: "Saúde"
  },
  attachment: {
    icon: Paperclip,
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    label: "Anexo"
  }
};

function getHealthBadgeStyle(status?: string) {
  switch (status) {
    case 'green':
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case 'yellow':
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case 'red':
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'todo': 'A Fazer',
    'in_progress': 'Em Andamento',
    'blocked': 'Bloqueado',
    'done': 'Concluído'
  };
  return statusMap[status] || status;
}

export default function ActivityTimelineCard({ activity, isFirst, isLast }: ActivityTimelineCardProps) {
  const navigate = useNavigate();
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  const handleClick = () => {
    let tab = 'indicadores';
    switch (activity.type) {
      case 'indicator':
        tab = 'indicadores';
        break;
      case 'milestone':
      case 'milestone_date':
        tab = 'marcos';
        break;
      case 'task_status':
      case 'task_date':
        tab = 'tarefas';
        break;
      case 'situation':
        tab = 'situacoes';
        break;
      default:
        tab = 'geral';
    }
    navigate(`/project-execution/${activity.projectId}?tab=${tab}`);
  };

  const getTrendIcon = () => {
    if (activity.previousProgress === undefined || activity.progress === undefined) return null;
    
    const diff = activity.progress - activity.previousProgress;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getProgressBadgeColor = () => {
    if (!activity.progress) return "";
    if (activity.progress >= 75) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (activity.progress >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  return (
    <div className="relative flex gap-4">
      {/* Timeline Dot */}
      <div className={cn(
        "absolute left-[-17px] w-6 h-6 rounded-full flex items-center justify-center z-10",
        config.bgColor
      )}>
        <Icon className={cn("h-3 w-3", config.iconColor)} />
      </div>

      {/* Card */}
      <Card 
        className="flex-1 p-4 hover:shadow-md transition-shadow cursor-pointer border-border"
        onClick={handleClick}
      >
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Project and Thesis badges */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-xs font-medium">
                  {activity.projectName}
                </Badge>
                {activity.thesisName && (
                  <Badge variant="outline" className="text-xs">
                    {activity.thesisName}
                  </Badge>
                )}
                <Badge variant="outline" className={cn("text-xs", config.bgColor, config.iconColor)}>
                  {config.label}
                </Badge>
              </div>
              
              {/* Title */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-foreground">
                  {activity.title}
                </h4>
                {getTrendIcon()}
                {activity.progress !== undefined && (
                  <Badge className={cn("text-xs", getProgressBadgeColor())}>
                    {activity.progress}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Critical badge */}
            {activity.isCritical && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                🔴 Crítico
              </Badge>
            )}
            
            {/* Health status badge */}
            {activity.type === 'health' && activity.metadata?.healthStatus && (
              <Badge className={cn("shrink-0 text-xs", getHealthBadgeStyle(activity.metadata.healthStatus))}>
                {activity.metadata.healthStatus === 'green' ? '🟢 Saudável' : 
                 activity.metadata.healthStatus === 'yellow' ? '🟡 Atenção' : '🔴 Crítico'}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {activity.type === 'task_status' && activity.metadata?.oldStatus && activity.metadata?.newStatus ? (
              <>
                <span className="font-medium">{getStatusLabel(activity.metadata.oldStatus)}</span>
                {' → '}
                <span className="font-medium">{getStatusLabel(activity.metadata.newStatus)}</span>
              </>
            ) : (
              activity.description
            )}
          </p>

          {/* Notes */}
          {activity.notes && (
            <p className="text-xs text-muted-foreground line-clamp-1 italic">
              {activity.notes}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activity.updatedBy.avatar} />
                <AvatarFallback className="text-xs">
                  {activity.updatedBy.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {activity.updatedBy.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.timestamp), { 
                addSuffix: true,
                locale: ptBR 
              })}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

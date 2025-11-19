import { ActivityFeedItem as Item } from "@/hooks/useActivityFeed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ActivityFeedItemProps {
  activity: Item;
}

export default function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const tab = activity.type === 'indicator' ? 'indicadores' : 'marcos';
    navigate(`/project-execution/${activity.projectId}?tab=${tab}`);
  };

  const getTrendIcon = () => {
    if (activity.previousProgress === undefined) return null;
    
    const diff = activity.progress - activity.previousProgress;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getProgressBadgeColor = () => {
    if (activity.progress >= 75) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (activity.progress >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border"
      onClick={handleClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              activity.type === 'indicator' 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-purple-100 dark:bg-purple-900/30"
            )}>
              {activity.type === 'indicator' ? (
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>

            {/* Project and Thesis badges - MOVED BEFORE TITLE */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-sm font-medium">
                  {activity.projectName}
                </Badge>
                {activity.thesisName && (
                  <Badge variant="outline" className="text-xs">
                    {activity.thesisName}
                  </Badge>
                )}
              </div>
              
              {/* Title and trend icon */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {activity.title}
                </h3>
                {getTrendIcon()}
              </div>
            </div>
          </div>

          {/* Critical badge */}
          {activity.isCritical && (
            <Badge variant="destructive" className="shrink-0">
              🔴 Crítico
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="ml-14">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-foreground font-medium">
              {activity.description}
            </p>
            <Badge className={cn("text-xs", getProgressBadgeColor())}>
              {activity.progress}%
            </Badge>
          </div>

          {/* Notes */}
          {activity.notes && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {activity.notes}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 ml-14 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={activity.updatedBy.avatar} />
              <AvatarFallback className="text-xs">
                {activity.updatedBy.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
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
  );
}

import { ActivityFeedItem } from "@/hooks/useActivityFeed";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ActivityFeedItemCompactProps {
  activity: ActivityFeedItem;
}

export default function ActivityFeedItemCompact({ activity }: ActivityFeedItemCompactProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const tab = activity.type === 'indicator' ? 'indicators' : 'progress';
    navigate(`/management/${activity.projectId}?tab=${tab}`);
  };

  const getTrendIcon = () => {
    if (activity.previousProgress === undefined) return null;
    
    const diff = activity.progress - activity.previousProgress;
    if (diff > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getProgressBadgeColor = () => {
    if (activity.progress >= 75) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (activity.progress >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  };

  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn(
        "p-1.5 rounded shrink-0",
        activity.type === 'indicator' 
          ? "bg-blue-100 dark:bg-blue-900/30" 
          : "bg-purple-100 dark:bg-purple-900/30"
      )}>
        {activity.type === 'indicator' ? (
          <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{activity.title}</h4>
            {getTrendIcon()}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {relativeTime}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {activity.description}
          </p>
          <Badge className={cn("text-xs", getProgressBadgeColor())}>
            {activity.progress}%
          </Badge>
        </div>

        {activity.isCritical && (
          <Badge variant="destructive" className="text-xs mt-2">
            🔴 Crítico
          </Badge>
        )}

        {activity.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {activity.notes}
          </p>
        )}
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { format, parseISO, isToday, isYesterday, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityFeedItem } from "@/hooks/useActivityFeed";
import ActivityTimelineCard from "./ActivityTimelineCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityTimelineProps {
  activities: ActivityFeedItem[] | undefined;
  isLoading: boolean;
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

function groupActivitiesByDate(activities: ActivityFeedItem[]): Record<string, ActivityFeedItem[]> {
  return activities.reduce((groups, activity) => {
    const dateKey = format(startOfDay(parseISO(activity.timestamp)), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, ActivityFeedItem[]>);
}

export default function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  const groupedActivities = useMemo(() => {
    if (!activities) return {};
    return groupActivitiesByDate(activities);
  }, [activities]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedActivities).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [groupedActivities]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="ml-6 space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <Skeleton className="h-24 flex-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma atividade encontrada para os filtros selecionados
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const dayActivities = groupedActivities[date];
        
        return (
          <div key={date} className="relative">
            {/* Date Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-4">
              <Badge 
                variant="outline" 
                className="text-sm font-semibold px-3 py-1"
              >
                {formatDateLabel(date)}
              </Badge>
            </div>
            
            {/* Timeline Container */}
            <div className="relative pl-6">
              {/* Timeline Line */}
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />
              
              {/* Activities */}
              <div className="space-y-4">
                {dayActivities.map((activity, index) => (
                  <ActivityTimelineCard 
                    key={activity.id} 
                    activity={activity}
                    isFirst={index === 0}
                    isLast={index === dayActivities.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

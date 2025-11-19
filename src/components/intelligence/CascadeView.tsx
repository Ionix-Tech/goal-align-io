import { useMemo } from "react";
import { ActivityFeedItem } from "@/hooks/useActivityFeed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ActivityFeedItemCompact from "./ActivityFeedItemCompact";

interface CascadeViewProps {
  activities: ActivityFeedItem[] | undefined;
  isLoading: boolean;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  thesisName: string | null;
  activities: ActivityFeedItem[];
}

export default function CascadeView({ activities, isLoading }: CascadeViewProps) {
  const groupedByProject = useMemo(() => {
    if (!activities) return [];

    const groups = new Map<string, ProjectGroup>();

    activities.forEach(activity => {
      if (!groups.has(activity.projectId)) {
        groups.set(activity.projectId, {
          projectId: activity.projectId,
          projectName: activity.projectName,
          thesisName: activity.thesisName,
          activities: []
        });
      }
      groups.get(activity.projectId)!.activities.push(activity);
    });

    return Array.from(groups.values());
  }, [activities]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (groupedByProject.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma atividade encontrada para os filtros selecionados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedByProject.map((group) => (
        <Card key={group.projectId} className="border-border overflow-hidden">
          <Collapsible defaultOpen={groupedByProject.length <= 3}>
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">
                      {group.projectName}
                    </h3>
                    {group.thesisName && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {group.thesisName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {group.activities.length} {group.activities.length === 1 ? 'item' : 'itens'}
                  </Badge>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                {group.activities.map(activity => (
                  <ActivityFeedItemCompact key={activity.id} activity={activity} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}

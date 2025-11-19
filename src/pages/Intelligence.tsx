import { useState } from "react";
import { Brain } from "lucide-react";
import ActivityFeedFilters from "@/components/intelligence/ActivityFeedFilters";
import ActivityFeedItem from "@/components/intelligence/ActivityFeedItem";
import { useActivityFeed, ActivityFeedFilters as Filters } from "@/hooks/useActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";

const Intelligence = () => {
  const [filters, setFilters] = useState<Filters>({
    period: 'week',
    activityType: 'all'
  });

  const { data: activities, isLoading } = useActivityFeed(filters);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Inteligência</h1>
            <p className="text-muted-foreground">
              Acompanhe as últimas atualizações de indicadores e milestones
            </p>
          </div>
        </div>

        {/* Filtros */}
        <ActivityFeedFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Feed */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))
          ) : activities?.length === 0 ? (
            // Empty state
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma atividade encontrada para os filtros selecionados
            </div>
          ) : (
            // Lista de atividades
            activities?.map((activity) => (
              <ActivityFeedItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Intelligence;

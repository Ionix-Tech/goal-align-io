import { useState } from "react";
import { Brain, List, FolderTree, AlertCircle } from "lucide-react";
import ActivityFeedFilters from "@/components/intelligence/ActivityFeedFilters";
import ActivityFeedItem from "@/components/intelligence/ActivityFeedItem";
import CascadeView from "@/components/intelligence/CascadeView";
import AttentionPointsView from "@/components/intelligence/AttentionPointsView";
import { useActivityFeed, ActivityFeedFilters as Filters } from "@/hooks/useActivityFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

        {/* Tabs para alternar entre Feed, Cascata e Pontos de Atenção */}
        <Tabs defaultValue="feed" className="w-full mt-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="feed" className="gap-2">
              <List className="h-4 w-4" />
              Feed Cronológico
            </TabsTrigger>
            <TabsTrigger value="cascade" className="gap-2">
              <FolderTree className="h-4 w-4" />
              O que está acontecendo
            </TabsTrigger>
            <TabsTrigger value="attention" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pontos de Atenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))
              ) : activities?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma atividade encontrada para os filtros selecionados
                </div>
              ) : (
                activities?.map((activity) => (
                  <ActivityFeedItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="cascade" className="mt-6">
            <CascadeView activities={activities} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="attention" className="mt-6">
            <AttentionPointsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Intelligence;

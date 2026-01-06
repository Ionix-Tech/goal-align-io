import { useState } from "react";
import { Brain, Activity, Calendar, FolderTree, AlertCircle, Users } from "lucide-react";
import ActivityFeedFilters from "@/components/intelligence/ActivityFeedFilters";
import ActivityTimeline from "@/components/intelligence/ActivityTimeline";
import CascadeView from "@/components/intelligence/CascadeView";
import AttentionPointsView from "@/components/intelligence/AttentionPointsView";
import { WorkloadDashboard } from "@/components/management/WorkloadDashboard";
import { useActivityFeed, ActivityFeedFilters as Filters } from "@/hooks/useActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Intelligence = () => {
  const [filters, setFilters] = useState<Filters>({
    period: 'week',
    activityType: 'all'
  });
  const [groupBy, setGroupBy] = useState<'date' | 'project'>('date');

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

        {/* Tabs para alternar entre Feed, Pontos de Atenção e Carga de Trabalho */}
        <Tabs defaultValue="feed" className="w-full mt-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="feed" className="gap-2">
              <Activity className="h-4 w-4" />
              Feed de Atividades
            </TabsTrigger>
            <TabsTrigger value="attention" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Pontos de Atenção
            </TabsTrigger>
            <TabsTrigger value="workload" className="gap-2">
              <Users className="h-4 w-4" />
              Carga de Trabalho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Agrupar por:</span>
              <ToggleGroup 
                type="single" 
                value={groupBy} 
                onValueChange={(v) => v && setGroupBy(v as 'date' | 'project')}
              >
                <ToggleGroupItem value="date" aria-label="Agrupar por data" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Data
                </ToggleGroupItem>
                <ToggleGroupItem value="project" aria-label="Agrupar por projeto" className="gap-2">
                  <FolderTree className="h-4 w-4" />
                  Projeto
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {groupBy === 'date' ? (
              <ActivityTimeline activities={activities} isLoading={isLoading} />
            ) : (
              <CascadeView activities={activities} isLoading={isLoading} />
            )}
          </TabsContent>

          <TabsContent value="attention" className="mt-6">
            <AttentionPointsView />
          </TabsContent>

          <TabsContent value="workload" className="mt-6">
            <WorkloadDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Intelligence;

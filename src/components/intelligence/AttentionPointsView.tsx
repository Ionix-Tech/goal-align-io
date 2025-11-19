import { useState, useMemo } from "react";
import { useAttentionPoints } from "@/hooks/useAttentionPoints";
import AttentionMetricsCards from "./AttentionMetricsCards";
import AttentionPointsFilters from "./AttentionPointsFilters";
import AttentionItem from "./AttentionItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Clock, Eye } from "lucide-react";

const AttentionPointsView = () => {
  const { data, isLoading } = useAttentionPoints();
  const [selectedThesis, setSelectedThesis] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  const filteredData = useMemo(() => {
    if (!data) return null;

    const filterItems = (items: any[]) => {
      return items.filter(item => {
        if (selectedThesis !== "all" && item.thesisId !== selectedThesis) return false;
        if (selectedProject !== "all" && item.projectId !== selectedProject) return false;
        if (selectedAssignee !== "all" && item.assignedTo !== selectedAssignee) return false;
        return true;
      });
    };

    return {
      ...data,
      overdueItems: filterItems(data.overdueItems),
      dueTodayItems: filterItems(data.dueTodayItems),
      dueIn3DaysItems: filterItems(data.dueIn3DaysItems),
      projectsAtRisk: filterItems(data.projectsAtRisk),
      projectsWithoutUpdates: filterItems(data.projectsWithoutUpdates),
      indicatorsWithoutMeasurement: filterItems(data.indicatorsWithoutMeasurement),
      longRunningTasks: filterItems(data.longRunningTasks),
    };
  }, [data, selectedThesis, selectedProject, selectedAssignee]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!filteredData) return null;

  const criticalItems = [
    ...filteredData.overdueItems,
    ...filteredData.projectsAtRisk.filter(p => p.healthStatus === 'red'),
  ];

  const warningItems = [
    ...filteredData.dueTodayItems,
    ...filteredData.dueIn3DaysItems,
    ...filteredData.projectsAtRisk.filter(p => p.healthStatus === 'yellow'),
  ];

  const monitoringItems = [
    ...filteredData.projectsWithoutUpdates,
    ...filteredData.indicatorsWithoutMeasurement,
    ...filteredData.longRunningTasks,
  ];

  return (
    <div>
      <AttentionMetricsCards
        criticalCount={data.criticalCount}
        dueTodayCount={data.dueTodayItems.length}
        atRiskCount={data.projectsAtRisk.length}
        noUpdateCount={data.projectsWithoutUpdates.length}
      />

      <AttentionPointsFilters
        selectedThesis={selectedThesis}
        selectedProject={selectedProject}
        selectedAssignee={selectedAssignee}
        onThesisChange={setSelectedThesis}
        onProjectChange={setSelectedProject}
        onAssigneeChange={setSelectedAssignee}
      />

      <Accordion type="single" collapsible defaultValue="critical" className="space-y-4">
        <AccordionItem value="critical" className="border rounded-lg bg-red-500/5 border-red-500/20">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-600">🔴 Crítico (Ação Imediata)</span>
              <span className="text-sm text-muted-foreground">({criticalItems.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {criticalItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum item crítico no momento 🎉</p>
            ) : (
              <div className="space-y-3">
                {criticalItems.map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="warning" className="border rounded-lg bg-yellow-500/5 border-yellow-500/20">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-600">🟡 Atenção (Próximos 3 Dias)</span>
              <span className="text-sm text-muted-foreground">({warningItems.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {warningItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum item requer atenção</p>
            ) : (
              <div className="space-y-3">
                {warningItems.map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="monitoring" className="border rounded-lg bg-blue-500/5 border-blue-500/20">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-600">⚠️ Monitoramento</span>
              <span className="text-sm text-muted-foreground">({monitoringItems.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {monitoringItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Tudo sob controle</p>
            ) : (
              <div className="space-y-3">
                {monitoringItems.map(item => (
                  <AttentionItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AttentionPointsView;

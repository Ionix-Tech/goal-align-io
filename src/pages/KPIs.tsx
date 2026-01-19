import { useState, useMemo } from 'react';
import { useKPIs, KPIFilters, KPIType } from '@/hooks/useKPIs';
import { usePillars } from '@/hooks/usePillars';
import { useTheses } from '@/hooks/useTheses';
import { useAreas } from '@/hooks/useAreas';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { KPIFiltersBar } from '@/components/kpis/KPIFiltersBar';
import { KPIConsolidatedGrid } from '@/components/kpis/KPIConsolidatedGrid';
import { KPIDetailDialog } from '@/components/kpis/KPIDetailDialog';
import { CreateKPIDialog } from '@/components/kpis/CreateKPIDialog';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Target, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';

export default function KPIs() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<KPIFilters>({ year: currentYear });
  const [selectedKPIId, setSelectedKPIId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createKPIType, setCreateKPIType] = useState<KPIType>('strategic');

  const { data: kpis, isLoading } = useKPIs(filters);
  const { data: pillars } = usePillars();
  const { data: theses } = useTheses({ year: filters.year });
  const { data: areas } = useAreas();
  const { data: teamMembers } = useTeamMembers();
  const { isManager } = useUserRole();

  // Group KPIs by type
  const groupedKPIs = useMemo(() => {
    if (!kpis) return { strategic: [], area: [], control: [] };
    return {
      strategic: kpis.filter(k => k.kpi_type === 'strategic'),
      area: kpis.filter(k => k.kpi_type === 'area'),
      control: kpis.filter(k => k.kpi_type === 'control')
    };
  }, [kpis]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!kpis) return { total: 0, green: 0, yellow: 0, red: 0 };
    
    const currentMonth = new Date().getMonth() + 1;
    let green = 0, yellow = 0, red = 0;
    
    kpis.forEach(kpi => {
      const monthValue = kpi.monthly_values?.find(v => v.month === currentMonth && v.year === filters.year);
      if (monthValue?.status === 'green') green++;
      else if (monthValue?.status === 'yellow') yellow++;
      else if (monthValue?.status === 'red') red++;
    });

    return { total: kpis.length, green, yellow, red };
  }, [kpis, filters.year]);

  const handleCreateKPI = (type: KPIType) => {
    setCreateKPIType(type);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indicadores (KPIs)</h1>
          <p className="text-muted-foreground">Gestão mensal de indicadores estratégicos, de área e de controle</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleCreateKPI('control')}>
              <Target className="h-4 w-4 mr-2" />
              KPI Controle
            </Button>
            <Button variant="outline" onClick={() => handleCreateKPI('area')}>
              <Building2 className="h-4 w-4 mr-2" />
              KPI Área
            </Button>
            <Button onClick={() => handleCreateKPI('strategic')}>
              <Plus className="h-4 w-4 mr-2" />
              KPI Estratégico
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de KPIs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No Alvo</p>
                <p className="text-2xl font-bold text-green-600">{stats.green}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atenção</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.yellow}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crítico</p>
                <p className="text-2xl font-bold text-red-600">{stats.red}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <KPIFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        pillars={pillars || []}
        theses={theses || []}
        areas={areas || []}
        teamMembers={teamMembers || []}
      />

      {/* KPI Grid by Type */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({kpis?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="strategic">
            Estratégicos ({groupedKPIs.strategic.length})
          </TabsTrigger>
          <TabsTrigger value="area">
            Área ({groupedKPIs.area.length})
          </TabsTrigger>
          <TabsTrigger value="control">
            Controle ({groupedKPIs.control.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <KPIConsolidatedGrid
            kpis={kpis || []}
            year={filters.year || currentYear}
            isLoading={isLoading}
            onKPIClick={(kpiId) => setSelectedKPIId(kpiId)}
          />
        </TabsContent>

        <TabsContent value="strategic" className="mt-4">
          <KPIConsolidatedGrid
            kpis={groupedKPIs.strategic}
            year={filters.year || currentYear}
            isLoading={isLoading}
            onKPIClick={(kpiId) => setSelectedKPIId(kpiId)}
          />
        </TabsContent>

        <TabsContent value="area" className="mt-4">
          <KPIConsolidatedGrid
            kpis={groupedKPIs.area}
            year={filters.year || currentYear}
            isLoading={isLoading}
            onKPIClick={(kpiId) => setSelectedKPIId(kpiId)}
          />
        </TabsContent>

        <TabsContent value="control" className="mt-4">
          <KPIConsolidatedGrid
            kpis={groupedKPIs.control}
            year={filters.year || currentYear}
            isLoading={isLoading}
            onKPIClick={(kpiId) => setSelectedKPIId(kpiId)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <KPIDetailDialog
        kpiId={selectedKPIId}
        open={!!selectedKPIId}
        onOpenChange={(open) => !open && setSelectedKPIId(null)}
      />

      <CreateKPIDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultType={createKPIType}
        pillars={pillars || []}
        theses={theses || []}
        areas={areas || []}
        teamMembers={teamMembers || []}
        existingKPIs={groupedKPIs.strategic}
      />
    </div>
  );
}

import { useMemo } from 'react';
import { KPI, KPIStatus } from '@/hooks/useKPIs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Building2, Crosshair } from 'lucide-react';

interface KPIConsolidatedGridProps {
  kpis: KPI[];
  year: number;
  isLoading?: boolean;
  onKPIClick: (kpiId: string) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const statusColors: Record<KPIStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500'
};

const statusBgColors: Record<KPIStatus, string> = {
  green: 'bg-green-50 hover:bg-green-100',
  yellow: 'bg-yellow-50 hover:bg-yellow-100',
  red: 'bg-red-50 hover:bg-red-100'
};

const typeIcons: Record<string, React.ReactNode> = {
  strategic: <Target className="h-3 w-3" />,
  area: <Building2 className="h-3 w-3" />,
  control: <Crosshair className="h-3 w-3" />
};

const typeLabels: Record<string, string> = {
  strategic: 'Estratégico',
  area: 'Área',
  control: 'Controle'
};

export function KPIConsolidatedGrid({ kpis, year, isLoading, onKPIClick }: KPIConsolidatedGridProps) {
  // Calculate YTD for each KPI
  const kpisWithYTD = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    
    return kpis.map(kpi => {
      const monthlyValues = kpi.monthly_values || [];
      const ytdValues = monthlyValues.filter(v => v.year === year && v.month <= currentMonth);
      
      let ytdTarget = 0, ytdActual = 0;
      ytdValues.forEach(v => {
        if (v.target_value) ytdTarget += v.target_value;
        if (v.actual_value) ytdActual += v.actual_value;
      });

      let ytdAchievement: number | null = null;
      let ytdStatus: KPIStatus | null = null;

      if (ytdTarget > 0) {
        ytdAchievement = (ytdActual / ytdTarget) * 100;
        
        if (kpi.direction === 'higher_better') {
          if (ytdAchievement >= 100) ytdStatus = 'green';
          else if (ytdAchievement >= 90) ytdStatus = 'yellow';
          else ytdStatus = 'red';
        } else {
          if (ytdAchievement <= 100) ytdStatus = 'green';
          else if (ytdAchievement <= 110) ytdStatus = 'yellow';
          else ytdStatus = 'red';
        }
      }

      return { ...kpi, ytdAchievement, ytdStatus };
    });
  }, [kpis, year]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum KPI encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[250px] sticky left-0 bg-muted/50 z-10">KPI</TableHead>
              <TableHead className="w-[80px] text-center">Tipo</TableHead>
              <TableHead className="w-[60px] text-center">Unid.</TableHead>
              {MONTHS.map((month, index) => (
                <TableHead key={month} className="w-[60px] text-center px-1">
                  {month}
                </TableHead>
              ))}
              <TableHead className="w-[70px] text-center font-bold">YTD</TableHead>
              <TableHead className="w-[80px] text-center">Projetos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpisWithYTD.map(kpi => (
              <TableRow 
                key={kpi.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onKPIClick(kpi.id)}
              >
                {/* KPI Name */}
                <TableCell className="sticky left-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    {kpi.direction === 'higher_better' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{kpi.name}</p>
                      {kpi.owner && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {kpi.owner.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs gap-1">
                    {typeIcons[kpi.kpi_type]}
                    {typeLabels[kpi.kpi_type]?.substring(0, 3)}
                  </Badge>
                </TableCell>

                {/* Unit */}
                <TableCell className="text-center text-xs text-muted-foreground">
                  {kpi.unit}
                </TableCell>

                {/* Monthly Values */}
                {MONTHS.map((_, monthIndex) => {
                  const monthValue = kpi.monthly_values?.find(v => v.month === monthIndex + 1 && v.year === year);
                  const achievement = monthValue?.target_value && monthValue?.actual_value
                    ? Math.round((monthValue.actual_value / monthValue.target_value) * 100)
                    : null;

                  return (
                    <TableCell 
                      key={monthIndex} 
                      className={cn(
                        "text-center px-1 text-xs",
                        monthValue?.status && statusBgColors[monthValue.status]
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center">
                            {monthValue?.status && (
                              <div className={cn("h-2 w-2 rounded-full mb-0.5", statusColors[monthValue.status])} />
                            )}
                            {achievement !== null ? (
                              <span className="font-medium">{achievement}%</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm space-y-1">
                            <p><strong>Meta:</strong> {monthValue?.target_value ?? 'N/A'} {kpi.unit}</p>
                            <p><strong>Real:</strong> {monthValue?.actual_value ?? 'N/A'} {kpi.unit}</p>
                            {achievement !== null && (
                              <p><strong>Gap:</strong> {achievement - 100}%</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  );
                })}

                {/* YTD */}
                <TableCell 
                  className={cn(
                    "text-center font-bold",
                    kpi.ytdStatus && statusBgColors[kpi.ytdStatus]
                  )}
                >
                  {kpi.ytdAchievement !== null ? (
                    <div className="flex flex-col items-center">
                      {kpi.ytdStatus && (
                        <div className={cn("h-2 w-2 rounded-full mb-0.5", statusColors[kpi.ytdStatus])} />
                      )}
                      <span>{Math.round(kpi.ytdAchievement)}%</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Projects Count */}
                <TableCell className="text-center">
                  {kpi.project_links?.length || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

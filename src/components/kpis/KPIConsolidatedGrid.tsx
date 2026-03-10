import React, { useMemo, useState } from 'react';
import { KPI, KPIStatus } from '@/hooks/useKPIs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Building2, Crosshair, Eye, EyeOff } from 'lucide-react';

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
  const [expandedKpiId, setExpandedKpiId] = useState<string | null>(null);

  // Calculate YTD for each KPI
  const kpisWithYTD = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    
    return kpis.map(kpi => {
      const monthlyValues = kpi.monthly_values || [];
      const ytdValues = monthlyValues.filter(v => v.year === year && v.month <= currentMonth);
      const isAverage = kpi.ytd_mode === 'average';

      let ytdTarget = 0, ytdActual = 0;
      let countTarget = 0, countActual = 0;
      // Only include months that have actual_value filled in the YTD calculation
      // This prevents inflating the target with months that haven't been reported yet
      ytdValues.forEach(v => {
        if (v.actual_value != null && v.actual_value !== 0) {
          ytdActual += v.actual_value; countActual++;
          if (v.target_value) { ytdTarget += v.target_value; countTarget++; }
        }
      });

      if (isAverage) {
        ytdTarget = countTarget > 0 ? ytdTarget / countTarget : 0;
        ytdActual = countActual > 0 ? ytdActual / countActual : 0;
      }

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

      return { ...kpi, ytdAchievement, ytdStatus, ytdActual, ytdTarget };
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
              <React.Fragment key={kpi.id}>
              <TableRow
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onKPIClick(kpi.id)}
              >
                {/* KPI Name */}
                <TableCell className="sticky left-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    <button
                      className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedKpiId(expandedKpiId === kpi.id ? null : kpi.id);
                      }}
                      title="Ver metas mensais"
                    >
                      {expandedKpiId === kpi.id ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {kpi.direction === 'higher_better' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium truncate max-w-[180px]">{kpi.name}</p>
                      {kpi.owner && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
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
                  const isAbsolute = kpi.display_format === 'absolute';

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
                            {isAbsolute ? (
                              monthValue?.actual_value !== null && monthValue?.actual_value !== undefined ? (
                                <span className="font-medium">{monthValue.actual_value.toLocaleString()}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            ) : (
                              achievement !== null ? (
                                <span className="font-medium">{achievement}%</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm space-y-1">
                            <p><strong>Meta:</strong> {monthValue?.target_value ?? 'N/A'} {kpi.unit}</p>
                            <p><strong>Real:</strong> {monthValue?.actual_value ?? 'N/A'} {kpi.unit}</p>
                            {achievement !== null && (
                              <p><strong>Atingimento:</strong> {achievement}%</p>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center">
                        {kpi.ytdStatus && (
                          <div className={cn("h-2 w-2 rounded-full mb-0.5", statusColors[kpi.ytdStatus])} />
                        )}
                        {kpi.display_format === 'absolute' ? (
                          kpi.ytdActual !== undefined ? (
                            <span>{kpi.ytdActual.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        ) : (
                          kpi.ytdAchievement !== null ? (
                            <span>{Math.round(kpi.ytdAchievement)}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm space-y-1">
                        <p><strong>Método:</strong> {kpi.ytd_mode === 'average' ? 'Média' : 'Acumulado'}</p>
                        <p><strong>Meta YTD:</strong> {kpi.ytdTarget?.toLocaleString() ?? 'N/A'} {kpi.unit}</p>
                        <p><strong>Real YTD:</strong> {kpi.ytdActual?.toLocaleString() ?? 'N/A'} {kpi.unit}</p>
                        {kpi.ytdAchievement !== null && (
                          <p><strong>Atingimento:</strong> {Math.round(kpi.ytdAchievement)}%</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>

                {/* Projects Count */}
                <TableCell className="text-center">
                  {kpi.project_links?.length || 0}
                </TableCell>
              </TableRow>

              {/* Expanded row with Meta/Real details */}
              {expandedKpiId === kpi.id && (
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell className="sticky left-0 bg-muted/20 z-10 text-xs text-muted-foreground py-1" colSpan={1}>
                    <div className="flex flex-col gap-0.5 pl-6">
                      <span className="text-muted-foreground">Meta</span>
                      <span className="font-medium text-foreground">Real</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1" />
                  <TableCell className="py-1" />
                  {MONTHS.map((_, monthIndex) => {
                    const monthValue = kpi.monthly_values?.find(v => v.month === monthIndex + 1 && v.year === year);
                    return (
                      <TableCell key={monthIndex} className="text-center px-1 text-xs py-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-muted-foreground">
                            {monthValue?.target_value != null ? monthValue.target_value.toLocaleString() : '-'}
                          </span>
                          <span className="font-medium">
                            {monthValue?.actual_value != null ? monthValue.actual_value.toLocaleString() : '-'}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center text-xs py-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-muted-foreground">
                        {kpi.ytdTarget != null ? kpi.ytdTarget.toLocaleString() : '-'}
                      </span>
                      <span className="font-medium">
                        {kpi.ytdActual != null ? kpi.ytdActual.toLocaleString() : '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1" />
                </TableRow>
              )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}

import { Edit, Trash2, TrendingUp, TrendingDown, Minus, PlusCircle, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ThesisKPI } from "@/hooks/useThesisDetails";

interface ThesisKPICardProps {
  kpi: ThesisKPI;
  canManage: boolean;
  onEdit: (kpi: ThesisKPI) => void;
  onDelete: (kpi: ThesisKPI) => void;
  onAddMeasurement: (kpi: ThesisKPI) => void;
  onViewHistory: (kpi: ThesisKPI) => void;
}

export function ThesisKPICard({ 
  kpi, 
  canManage, 
  onEdit, 
  onDelete,
  onAddMeasurement,
  onViewHistory 
}: ThesisKPICardProps) {
  const currentValue = kpi.current_value ?? 0;
  const progress = kpi.target_value > 0 
    ? Math.min(100, (currentValue / kpi.target_value) * 100)
    : 0;
  
  const progressStatus = progress >= 100 
    ? "completed" 
    : progress >= 70 
      ? "on-track" 
      : progress >= 40 
        ? "at-risk" 
        : "behind";

  const statusColors = {
    completed: "text-green-600",
    "on-track": "text-blue-600",
    "at-risk": "text-yellow-600",
    behind: "text-red-600",
  };

  const StatusIcon = progress >= 100 
    ? TrendingUp 
    : progress >= 50 
      ? Minus 
      : TrendingDown;

  return (
    <Card className="bg-muted/50 group relative">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${statusColors[progressStatus]}`} />
              <p className="font-medium truncate">{kpi.name}</p>
            </div>
            {kpi.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {kpi.description}
              </p>
            )}
          </div>
          
          {canManage && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onAddMeasurement(kpi)}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Nova medição</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onViewHistory(kpi)}
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver histórico</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(kpi)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(kpi)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              {currentValue.toLocaleString('pt-BR')}{kpi.unit ? ` ${kpi.unit}` : ''}
            </span>
            <span className="text-muted-foreground">
              / {kpi.target_value.toLocaleString('pt-BR')}{kpi.unit ? ` ${kpi.unit}` : ''}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progress.toFixed(0)}% da meta
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

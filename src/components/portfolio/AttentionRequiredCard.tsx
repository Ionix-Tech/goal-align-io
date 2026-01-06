import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface AttentionRequiredCardProps {
  projectId: string;
  projectName: string;
  reason: string;
  severity: 'critical' | 'warning';
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  idea: 'Ideia',
  draft: 'Rascunho',
  review: 'Em Revisão',
  approved: 'Em Andamento',
  completed: 'Finalizado',
  archived: 'Arquivado',
};

export function AttentionRequiredCard({
  projectId,
  projectName,
  reason,
  severity,
  status,
}: AttentionRequiredCardProps) {
  const navigate = useNavigate();

  const handleViewProject = () => {
    if (status === 'approved') {
      navigate(`/management/${projectId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200 hover:shadow-md",
      severity === 'critical' ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : 
      "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "rounded-lg p-2",
            severity === 'critical' ? "bg-red-500/10" : "bg-amber-500/10"
          )}>
            {severity === 'critical' ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm leading-tight">
                  {projectName}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {reason}
                </p>
              </div>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {STATUS_LABELS[status] || status}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-xs"
              onClick={handleViewProject}
            >
              Ver Projeto
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

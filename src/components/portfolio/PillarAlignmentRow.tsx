import { useState } from "react";
import { ChevronDown, ChevronRight, Target, BarChart3, FolderKanban, Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlignmentProgressBar } from "./AlignmentProgressBar";
import { PillarAlignment, ThesisAlignment } from "@/hooks/useStrategicAlignment";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PillarAlignmentRowProps {
  pillar: PillarAlignment;
}

const PILLAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  corpo: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' },
  alma: { bg: 'bg-rose-100 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' },
  mente: { bg: 'bg-sky-100 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900' },
};

const STATUS_CONFIG = {
  covered: { icon: CheckCircle2, color: 'text-green-600', label: 'Coberta' },
  partial: { icon: AlertCircle, color: 'text-amber-500', label: 'Parcial' },
  gap: { icon: AlertCircle, color: 'text-red-500', label: 'Gap' },
};

function ThesisRow({ thesis }: { thesis: ThesisAlignment }) {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[thesis.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="pl-8 py-3 border-b border-border/50 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4 flex-shrink-0", statusConfig.color)} />
            <button 
              onClick={() => navigate(`/theses/${thesis.id}`)}
              className="font-medium text-sm hover:text-primary transition-colors truncate text-left"
            >
              {thesis.name}
            </button>
            <Badge variant="outline" className="text-xs">
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 pl-6">
            {thesis.objective}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5" />
            <span>{thesis.projectCount} {thesis.projectCount === 1 ? 'projeto' : 'projetos'}</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{thesis.kpiCount} {thesis.kpiCount === 1 ? 'KPI' : 'KPIs'}</span>
          </div>
        </div>
      </div>

      {/* Projects list */}
      {thesis.projects.length > 0 && (
        <div className="mt-2 pl-6 flex flex-wrap gap-1.5">
          {thesis.projects.slice(0, 5).map(project => (
            <Badge 
              key={project.id}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.initiative_type === 'idea' ? (
                <Lightbulb className="h-3 w-3 mr-1" />
              ) : (
                <FolderKanban className="h-3 w-3 mr-1" />
              )}
              {project.name}
            </Badge>
          ))}
          {thesis.projects.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{thesis.projects.length - 5} mais
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export function PillarAlignmentRow({ pillar }: PillarAlignmentRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = PILLAR_COLORS[pillar.pillar_type] || PILLAR_COLORS.corpo;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("rounded-lg border", colors.border, colors.bg)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Target className={cn("h-5 w-5", colors.text)} />
              <div className="text-left">
                <h4 className={cn("font-semibold", colors.text)}>{pillar.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {pillar.thesisCount} {pillar.thesisCount === 1 ? 'tese' : 'teses'} · {pillar.projectCount} {pillar.projectCount === 1 ? 'projeto' : 'projetos'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-48">
              <AlignmentProgressBar value={pillar.coverage} size="sm" />
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-border/50 bg-card/50">
            {pillar.theses.length > 0 ? (
              pillar.theses.map(thesis => (
                <ThesisRow key={thesis.id} thesis={thesis} />
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nenhuma tese estratégica vinculada a este pilar.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

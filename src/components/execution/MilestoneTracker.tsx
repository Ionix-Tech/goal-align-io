import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Milestone {
  id: string;
  title: string;
  target_date: string;
  completed: boolean;
  completed_at: string | null;
  progress: number;
  milestone_type?: 'decolagem' | 'voo' | 'escala' | null;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
}

const MILESTONE_TYPE_ORDER = {
  decolagem: 1,
  voo: 2,
  escala: 3,
} as const;

const MILESTONE_TYPE_LABELS = {
  decolagem: 'M1 - Decolagem',
  voo: 'M2 - Voo',
  escala: 'M3 - Escala',
} as const;

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  // Separar milestones fixos (M1, M2, M3) dos extras
  const fixedMilestones = milestones
    .filter(m => m.milestone_type && m.milestone_type in MILESTONE_TYPE_ORDER)
    .sort((a, b) => {
      const orderA = MILESTONE_TYPE_ORDER[a.milestone_type as keyof typeof MILESTONE_TYPE_ORDER] || 99;
      const orderB = MILESTONE_TYPE_ORDER[b.milestone_type as keyof typeof MILESTONE_TYPE_ORDER] || 99;
      return orderA - orderB;
    });

  const extraMilestones = milestones
    .filter(m => !m.milestone_type || !(m.milestone_type in MILESTONE_TYPE_ORDER))
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());

  const allMilestones = [...fixedMilestones, ...extraMilestones];

  // Encontrar o milestone atual (primeiro não completo)
  const currentMilestoneIndex = allMilestones.findIndex(m => !m.completed);

  if (allMilestones.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-6 text-center text-muted-foreground">
        Nenhum milestone definido
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Progresso dos Milestones</h3>
      </div>
      
      <div className="relative">
        {/* Linha de conexão */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
        
        {/* Milestones */}
        <div className="relative flex justify-between">
          {allMilestones.map((milestone, index) => {
            const isCompleted = milestone.completed;
            const isCurrent = index === currentMilestoneIndex;
            const isPast = index < currentMilestoneIndex || (currentMilestoneIndex === -1 && isCompleted);
            
            const typeLabel = milestone.milestone_type && MILESTONE_TYPE_LABELS[milestone.milestone_type as keyof typeof MILESTONE_TYPE_LABELS];
            const displayTitle = typeLabel || milestone.title;
            
            return (
              <div 
                key={milestone.id} 
                className={cn(
                  "flex flex-col items-center text-center min-w-[100px] max-w-[140px]",
                  "transition-all duration-200"
                )}
              >
                {/* Ícone */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 bg-background",
                  isCompleted && "bg-green-500 border-green-500",
                  isCurrent && !isCompleted && "border-primary bg-primary/10",
                  !isCompleted && !isCurrent && "border-muted-foreground/30"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <span className={cn(
                      "text-sm font-bold",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {milestone.progress}%
                    </span>
                  )}
                </div>
                
                {/* Título */}
                <p className={cn(
                  "mt-2 text-xs font-medium line-clamp-2",
                  isCompleted && "text-green-600 dark:text-green-400",
                  isCurrent && !isCompleted && "text-primary font-semibold",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}>
                  {displayTitle}
                </p>
                
                {/* Data */}
                <p className={cn(
                  "text-[10px]",
                  isCompleted ? "text-green-600/70 dark:text-green-400/70" : "text-muted-foreground"
                )}>
                  {format(new Date(milestone.target_date), "dd MMM", { locale: ptBR })}
                </p>
                
                {/* Badge de atual */}
                {isCurrent && !isCompleted && (
                  <span className="mt-1 px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full font-medium">
                    Atual
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

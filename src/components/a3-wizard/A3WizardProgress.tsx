import { cn } from "@/lib/utils";
import { Check, FileText, Target, Search, Lightbulb, ClipboardList, Shield } from "lucide-react";

interface A3WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  canNavigateTo: (step: number) => boolean;
}

const steps = [
  { number: 1, label: "Contexto", sublabel: "O que é esse projeto?", icon: FileText },
  { number: 2, label: "Requisitos", sublabel: "O que precisa dar certo?", icon: Target },
  { number: 3, label: "Situação Atual", sublabel: "Onde estamos hoje?", icon: Search },
  { number: 4, label: "Situação Alvo", sublabel: "Onde queremos chegar?", icon: Lightbulb },
  { number: 5, label: "Plano de Ação", sublabel: "O que vamos fazer?", icon: ClipboardList },
  { number: 6, label: "Controle", sublabel: "Quando vamos verificar?", icon: Shield },
];

export function A3WizardProgress({ currentStep, onStepClick, canNavigateTo }: A3WizardProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = canNavigateTo(step.number);
          const Icon = step.icon;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                    isCompleted && "bg-success text-success-foreground",
                    isCurrent && "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    isCurrent ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground text-center max-w-[80px] leading-tight hidden sm:block">
                  {step.sublabel}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    step.number < currentStep ? "bg-success" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

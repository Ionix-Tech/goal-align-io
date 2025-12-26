import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string;
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  title,
  side = "top",
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            className
          )}
          aria-label="Ajuda"
        >
          <HelpCircle className={cn("h-4 w-4", iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-xs text-sm"
        sideOffset={5}
      >
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-muted-foreground">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-defined help texts for common fields
export const HELP_TEXTS = {
  strategicPillar: {
    title: "Pilar Estratégico",
    content:
      "Define a qual objetivo estratégico da empresa este projeto contribui. Escolha o pilar que melhor representa o impacto principal do projeto.",
  },
  situationCurrent: {
    title: "Situação Atual",
    content:
      "Descreva o problema ou cenário atual que precisa ser resolvido. Seja específico sobre métricas, processos ou resultados atuais.",
  },
  situationTarget: {
    title: "Situação Alvo",
    content:
      "Descreva o resultado esperado após a conclusão. Inclua métricas mensuráveis e prazos quando possível.",
  },
  indicator: {
    title: "Indicador",
    content:
      "Métricas que serão usadas para medir o progresso do projeto. Defina valores atuais e metas para acompanhamento.",
  },
  milestone: {
    title: "Marco/Entrega",
    content:
      "Entregas importantes do projeto com datas alvo. Ajuda a visualizar o progresso e identificar atrasos.",
  },
  context: {
    title: "Contexto",
    content:
      "Informações de background que ajudam a entender o projeto. Inclua histórico relevante, stakeholders e dependências.",
  },
  objective: {
    title: "Objetivo",
    content:
      "O objetivo principal do projeto. Deve ser claro, mensurável e alinhado com a estratégia da empresa.",
  },
  requirements: {
    title: "Requisitos",
    content:
      "Recursos necessários para execução: orçamento, equipe, ferramentas, aprovações ou qualquer dependência externa.",
  },
  category: {
    title: "Categoria",
    content:
      "Classificação do projeto por área de impacto. Ajuda a organizar e filtrar projetos por tema.",
  },
} as const;

// Component with label integration
interface LabelWithHelpProps {
  label: string;
  htmlFor?: string;
  helpKey?: keyof typeof HELP_TEXTS;
  customHelp?: { title?: string; content: string };
  required?: boolean;
  className?: string;
}

export function LabelWithHelp({
  label,
  htmlFor,
  helpKey,
  customHelp,
  required,
  className,
}: LabelWithHelpProps) {
  const helpConfig = helpKey ? HELP_TEXTS[helpKey] : customHelp;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {helpConfig && (
        <HelpTooltip
          title={helpConfig.title}
          content={helpConfig.content}
        />
      )}
    </div>
  );
}

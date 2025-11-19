import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database['public']['Enums']['project_status'];

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
  idea: {
    label: 'Ideia',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '💡'
  },
  draft: {
    label: 'Detalhamento e Aprofundamento',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '📝'
  },
  review: {
    label: 'Em Análise',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '⏳'
  },
  approved: {
    label: 'Em Andamento',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '▶️'
  },
  completed: {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '✅'
  },
  archived: {
    label: 'Arquivado',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '📦'
  }
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        config.color,
        className
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

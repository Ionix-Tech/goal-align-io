import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type HealthStatus = 'green' | 'amber' | 'red';

interface HealthStatusBadgeProps {
  status: HealthStatus | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  green: {
    label: 'Saudável',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  amber: {
    label: 'Atenção',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100'
  },
  red: {
    label: 'Crítico',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-100'
  }
};

export function HealthStatusBadge({
  status,
  size = 'md',
  showLabel = false,
  className
}: HealthStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn("gap-2", className)}>
        <div className={cn(
          "rounded-full",
          size === 'sm' && "h-2 w-2",
          size === 'md' && "h-3 w-3",
          size === 'lg' && "h-4 w-4",
          "bg-gray-300"
        )} />
        {showLabel && <span className="text-xs">Sem status</span>}
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2",
        config.bgColor,
        "border-transparent",
        className
      )}
    >
      <div className={cn(
        "rounded-full",
        size === 'sm' && "h-2 w-2",
        size === 'md' && "h-3 w-3",
        size === 'lg' && "h-4 w-4",
        config.color
      )} />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.textColor)}>
          {config.label}
        </span>
      )}
    </Badge>
  );
}

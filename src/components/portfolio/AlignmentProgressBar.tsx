import { cn } from "@/lib/utils";

interface AlignmentProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function AlignmentProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  className,
}: AlignmentProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getColorClass = () => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <div className={cn("flex-1 bg-muted rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

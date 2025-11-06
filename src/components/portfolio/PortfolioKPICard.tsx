import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'critical' | 'success';
  className?: string;
}

export function PortfolioKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: PortfolioKPICardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      variant === 'critical' && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
      variant === 'success' && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">
                {value}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-2.5",
            variant === 'critical' ? "bg-red-500/10" :
            variant === 'success' ? "bg-green-500/10" :
            "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              variant === 'critical' ? "text-red-600" :
              variant === 'success' ? "text-green-600" :
              "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import * as React from "react";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErrorSeverity = "error" | "warning" | "info";

interface ErrorMessageProps {
  title: string;
  cause?: string;
  action?: string;
  severity?: ErrorSeverity;
  className?: string;
}

const severityConfig = {
  error: {
    icon: XCircle,
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    textColor: "text-destructive",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

export function ErrorMessage({
  title,
  cause,
  action,
  severity = "error",
  className,
}: ErrorMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
        <div className="space-y-1">
          <p className={cn("font-medium", config.textColor)}>{title}</p>
          {cause && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Causa:</span> {cause}
            </p>
          )}
          {action && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Ação sugerida:</span> {action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to show contextual toast errors
export function showContextualError(
  toastFn: (message: string, options?: { description?: string }) => void,
  error: {
    title: string;
    cause?: string;
    action?: string;
  }
) {
  const description = [error.cause, error.action].filter(Boolean).join(" • ");
  toastFn(error.title, description ? { description } : undefined);
}

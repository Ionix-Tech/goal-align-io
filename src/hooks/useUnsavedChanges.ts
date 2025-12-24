import { useEffect, useCallback, useState } from "react";
import { useBlocker } from "react-router-dom";

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * Hook to detect unsaved changes and warn user before leaving the page
 * 
 * @param hasChanges - Whether there are unsaved changes
 * @param options - Configuration options
 * @returns Object with blocker state and reset function
 */
export function useUnsavedChanges(
  hasChanges: boolean,
  options: UseUnsavedChangesOptions = {}
) {
  const {
    enabled = true,
    message = "Você tem alterações não salvas. Deseja realmente sair?",
  } = options;

  // Block navigation using react-router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enabled &&
      hasChanges &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser unload event (refresh, close tab)
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, hasChanges, message]);

  const proceedNavigation = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }, [blocker]);

  const cancelNavigation = useCallback(() => {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isBlocked: blocker.state === "blocked",
    proceedNavigation,
    cancelNavigation,
    message,
  };
}

/**
 * Hook to track form changes
 * 
 * @param initialValues - The initial form values
 * @param currentValues - The current form values
 * @returns Whether the form has unsaved changes
 */
export function useFormChanges<T>(initialValues: T, currentValues: T): boolean {
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(initialValues) !== JSON.stringify(currentValues);
    setHasChanges(changed);
  }, [initialValues, currentValues]);

  return hasChanges;
}

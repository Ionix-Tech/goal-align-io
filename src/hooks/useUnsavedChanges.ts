import { useEffect, useState } from "react";

interface UseUnsavedChangesOptions {
  enabled?: boolean;
  message?: string;
}

/**
 * Hook to detect unsaved changes and warn user before leaving the page
 * Uses browser's beforeunload event for refresh/close tab protection
 * 
 * @param hasChanges - Whether there are unsaved changes
 * @param options - Configuration options
 * @returns Object with state (for compatibility)
 */
export function useUnsavedChanges(
  hasChanges: boolean,
  options: UseUnsavedChangesOptions = {}
) {
  const {
    enabled = true,
    message = "Você tem alterações não salvas. Deseja realmente sair?",
  } = options;

  const shouldBlock = enabled && hasChanges;

  // Handle browser unload event (refresh, close tab)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock, message]);

  // Return stub values for compatibility with existing code
  // The dialog won't show for in-app navigation anymore
  return {
    isBlocked: false,
    proceedNavigation: () => {},
    cancelNavigation: () => {},
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

import { useCallback } from "react";
import { celebrateBackgroundClick, celebrateCompletion } from "../lib/celebration";

export function useCelebration() {
  const completionBurst = useCallback((target: HTMLElement | null) => {
    celebrateCompletion(target);
  }, []);

  const backgroundBurst = useCallback((event: MouseEvent | PointerEvent) => {
    celebrateBackgroundClick(event);
  }, []);

  return { completionBurst, backgroundBurst };
}

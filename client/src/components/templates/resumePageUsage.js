import { useEffect, useRef } from "react";
import {
  RESUME_PAGE_HEIGHT_PX,
  getLayoutMeasureKey,
} from "@/components/editor/utils/resumeLayoutUtils";

/**
 * Reports template scroll height for pagination. Invalidates cached height when
 * layout sliders (font size, margins, spacing) change so reverting values remeasures.
 */
export function useResumePageUsage(containerRef, resumeData, onPageUsageChange, templateName) {
  const lastHeightRef = useRef(-1);
  const onPageUsageChangeRef = useRef(onPageUsageChange);
  useEffect(() => {
    onPageUsageChangeRef.current = onPageUsageChange;
  }, [onPageUsageChange]);

  const layoutMeasureKey = getLayoutMeasureKey(
    resumeData?.layoutSettings,
    resumeData?.density || "medium"
  );

  useEffect(() => {
    lastHeightRef.current = -1;
  }, [layoutMeasureKey]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !onPageUsageChangeRef.current) return;

    const currentHeight = node.scrollHeight;
    if (
      lastHeightRef.current >= 0 &&
      Math.abs(lastHeightRef.current - currentHeight) < 2
    ) {
      return;
    }
    lastHeightRef.current = currentHeight;

    const maxHeight = RESUME_PAGE_HEIGHT_PX;
    const isOverflowing = currentHeight > maxHeight;
    const overflowPercentage = isOverflowing
      ? Math.round(((currentHeight - maxHeight) / maxHeight) * 100)
      : 0;

    onPageUsageChangeRef.current({
      isOverflowing,
      currentHeight,
      maxHeight,
      overflowPercentage,
      percentage: Math.round((currentHeight / maxHeight) * 100),
      templateName,
    });
  }, [resumeData, layoutMeasureKey, containerRef, templateName]);
}

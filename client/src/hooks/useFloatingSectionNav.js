import {useCallback, useEffect, useRef, useState} from "react";
import {useLocalStorage} from "./useLocalStorage";

export const useFloatingSectionNav = () => {
  const [showFloatingNav, setShowFloatingNav] = useState(false);
  const [floatingNavOffset, setFloatingNavOffset] = useLocalStorage(
    "floatingNavOffset",
    {x: 0, y: 0}
  );
  const [isDraggingFloatingNav, setIsDraggingFloatingNav] = useState(false);

  const floatingNavDragRef = useRef({
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const floatingNavContainerRef = useRef(null);
  const floatingNavMovedRef = useRef(false);
  const floatingNavSuppressToggleRef = useRef(false);

  const clampFloatingNavOffset = useCallback((nextX, nextY) => {
    const margin = 12;
    const baseRight = 24;
    const baseBottom = 80;
    const panelWidth = floatingNavContainerRef.current?.offsetWidth || 44;
    const panelHeight = floatingNavContainerRef.current?.offsetHeight || 44;

    const baseLeft = window.innerWidth - baseRight - panelWidth;
    const baseTop = window.innerHeight - baseBottom - panelHeight;

    const minX = margin - baseLeft;
    const maxX = baseRight - margin;
    const minY = margin - baseTop;
    const maxY = baseBottom - margin;

    return {
      x: Math.min(maxX, Math.max(minX, nextX)),
      y: Math.min(maxY, Math.max(minY, nextY)),
    };
  }, []);

  useEffect(() => {
    if (!isDraggingFloatingNav) return;

    const handleMouseMove = (e) => {
      const {startX, startY, offsetX, offsetY} = floatingNavDragRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        floatingNavMovedRef.current = true;
      }

      const clamped = clampFloatingNavOffset(offsetX + deltaX, offsetY + deltaY);
      setFloatingNavOffset(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingFloatingNav(false);

      if (floatingNavMovedRef.current) {
        floatingNavSuppressToggleRef.current = true;
        window.setTimeout(() => {
          floatingNavSuppressToggleRef.current = false;
        }, 0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingFloatingNav, clampFloatingNavOffset, setFloatingNavOffset]);

  const clampCurrentFloatingNavOffset = useCallback(() => {
    const currentX = floatingNavOffset?.x || 0;
    const currentY = floatingNavOffset?.y || 0;
    const clamped = clampFloatingNavOffset(currentX, currentY);

    if (clamped.x !== currentX || clamped.y !== currentY) {
      setFloatingNavOffset(clamped);
    }
  }, [floatingNavOffset, clampFloatingNavOffset, setFloatingNavOffset]);

  useEffect(() => {
    clampCurrentFloatingNavOffset();
  }, [clampCurrentFloatingNavOffset, showFloatingNav]);

  useEffect(() => {
    window.addEventListener("resize", clampCurrentFloatingNavOffset);
    return () => {
      window.removeEventListener("resize", clampCurrentFloatingNavOffset);
    };
  }, [clampCurrentFloatingNavOffset]);

  const handleFloatingNavDragStart = useCallback(
    (e) => {
      e.preventDefault();
      floatingNavMovedRef.current = false;
      setIsDraggingFloatingNav(true);
      floatingNavDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        offsetX: floatingNavOffset?.x || 0,
        offsetY: floatingNavOffset?.y || 0,
      };
    },
    [floatingNavOffset]
  );

  const toggleFloatingNav = useCallback(() => {
    if (floatingNavSuppressToggleRef.current) return;
    setShowFloatingNav((prev) => !prev);
  }, []);

  const closeFloatingNav = useCallback(() => {
    setShowFloatingNav(false);
  }, []);

  return {
    showFloatingNav,
    floatingNavOffset,
    floatingNavContainerRef,
    toggleFloatingNav,
    closeFloatingNav,
    handleFloatingNavDragStart,
  };
};

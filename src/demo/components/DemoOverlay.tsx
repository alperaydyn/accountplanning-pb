import { useEffect, useState, useCallback } from "react";
import { useDemo } from "../contexts/DemoContext";
import { ElementRect } from "../types";

export function DemoOverlay() {
  const { state, currentStep } = useDemo();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);

  const updateTargetRect = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(currentStep.elementSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Scroll element into view if needed
      if (currentStep.actions?.some((a) => a.type === "scroll")) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Update rect on step change and window resize
  useEffect(() => {
    if (!state.isActive) return;

    updateTargetRect();

    // Small delay to allow for any animations
    const timeout = setTimeout(updateTargetRect, 300);

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [state.isActive, state.currentStepIndex, updateTargetRect]);

  if (!state.isActive || !targetRect) {
    return null;
  }

  const highlightType = currentStep?.highlightType || "spotlight";

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Dimmed overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="hsl(var(--background))"
          fillOpacity="0.75"
          mask="url(#spotlight-mask)"
          className="transition-all duration-300"
        />
      </svg>

      {/* Highlight border/effects */}
      <div
        className={`absolute rounded-lg transition-all duration-300 ${
          highlightType === "border"
            ? "border-2 border-primary shadow-lg"
            : highlightType === "pulse"
              ? "border-2 border-primary animate-pulse shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
              : "ring-2 ring-primary ring-offset-2 ring-offset-background"
        }`}
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />

      {/* Arrow indicator */}
      {highlightType === "arrow" && (
        <div
          className="absolute w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-primary animate-bounce"
          style={{
            top: targetRect.top - 24,
            left: targetRect.left + targetRect.width / 2 - 12,
          }}
        />
      )}
    </div>
  );
}

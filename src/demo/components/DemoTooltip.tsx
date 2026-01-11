import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Volume2 } from "lucide-react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDemoAudio } from "../hooks/useDemoAudio";

export function DemoTooltip() {
  const { state, currentStep, nextStep, previousStep, stopDemo, progress } = useDemo();
  const { language, t } = useLanguage();
  const { audioProgress, isLoading } = useDemoAudio();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const isActive = state.isActive;
  const currentStepIndex = state.currentStepIndex;

  const calculatePosition = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.elementSelector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 180;
    const padding = 16;
    const preferredPosition = currentStep.position || "auto";

    let top = 0;
    let left = 0;

    // Calculate available space
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;

    // Determine vertical position
    if (preferredPosition === "top" && spaceAbove > tooltipHeight + padding) {
      top = rect.top - tooltipHeight - padding;
    } else if (
      preferredPosition === "bottom" &&
      spaceBelow > tooltipHeight + padding
    ) {
      top = rect.bottom + padding;
    } else if (spaceBelow > tooltipHeight + padding) {
      top = rect.bottom + padding;
    } else if (spaceAbove > tooltipHeight + padding) {
      top = rect.top - tooltipHeight - padding;
    } else {
      top = Math.max(padding, (window.innerHeight - tooltipHeight) / 2);
    }

    // Determine horizontal position
    if (preferredPosition === "left" && spaceLeft > tooltipWidth + padding) {
      left = rect.left - tooltipWidth - padding;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
    } else if (
      preferredPosition === "right" &&
      spaceRight > tooltipWidth + padding
    ) {
      left = rect.right + padding;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
    } else {
      // Center horizontally relative to element
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      // Ensure it stays within viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    }

    // Ensure vertical bounds
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setPosition({ top, left });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    calculatePosition();

    const timeout = setTimeout(calculatePosition, 350);

    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [isActive, currentStepIndex, calculatePosition]);

  // Memoize step content to prevent unnecessary recalculations
  const stepContent = useMemo(() => {
    return currentStep?.content[language];
  }, [currentStep, language]);

  const totalSteps = state.currentScript?.steps.length || 0;
  const currentStepNum = currentStepIndex + 1;

  // Render nothing if not active - but hooks are already called above
  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <Card
      className="fixed z-[9999] w-[360px] shadow-xl border-primary/20 bg-card"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with step counter and close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {currentStepNum} / {totalSteps}
            </span>
            {isLoading && (
              <Volume2 className="h-3 w-3 text-primary animate-pulse" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={stopDemo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main content */}
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            {stepContent?.shortText}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {stepContent?.narrative}
          </p>
        </div>

        {/* Progress bar */}
        <Progress value={audioProgress} className="h-1" />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t.common.previous}
          </Button>

          <div className="flex-1 mx-2">
            <Progress value={progress} className="h-1.5" />
          </div>

          <Button variant="default" size="sm" onClick={nextStep}>
            {currentStepNum === totalSteps ? t.common.close : t.common.next}
            {currentStepNum < totalSteps && (
              <ChevronRight className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

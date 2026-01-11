import { useEffect, useRef } from "react";
import { useDemo } from "../contexts/DemoContext";
import type { DemoAction } from "../types";

type TimeoutId = ReturnType<typeof setTimeout>;

async function waitForSelector(
  selector: string,
  opts: { timeoutMs: number; intervalMs: number; shouldContinue: () => boolean }
): Promise<Element | null> {
  const start = Date.now();

  // Fast path
  const immediate = document.querySelector(selector);
  if (immediate) return immediate;

  return new Promise((resolve) => {
    const tick = () => {
      if (!opts.shouldContinue()) {
        resolve(null);
        return;
      }

      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }

      if (Date.now() - start >= opts.timeoutMs) {
        resolve(null);
        return;
      }

      setTimeout(tick, opts.intervalMs);
    };

    tick();
  });
}

function safeClick(el: Element) {
  if (el instanceof HTMLElement) {
    el.click();
    return;
  }

  // Fallback: dispatch a bubbling click
  el.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, view: window })
  );
}

export function useDemoActions() {
  const { state, currentStep } = useDemo();
  const timeoutsRef = useRef<TimeoutId[]>([]);
  const activeStepIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear pending actions whenever step changes
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    if (!state.isActive || !state.isPlaying || !currentStep) return;

    // Run actions only once per step
    if (activeStepIdRef.current === currentStep.id) return;
    activeStepIdRef.current = currentStep.id;

    const stepId = currentStep.id;
    const baseSelector = currentStep.elementSelector;
    const actions = currentStep.actions ?? [];

    const shouldContinue = () =>
      state.isActive &&
      state.isPlaying &&
      activeStepIdRef.current === stepId;

    const runAction = async (action: DemoAction) => {
      if (!shouldContinue()) return;

      const selector = action.target ?? baseSelector;

      switch (action.type) {
        case "scroll": {
          const el = document.querySelector(selector);
          if (el) {
            if (action.scrollAmount !== undefined) {
              // Scroll by a specific amount within the element
              el.scrollBy({ top: action.scrollAmount, behavior: "smooth" });
            } else {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }
          return;
        }

        case "hover": {
          const el = document.querySelector(selector);
          if (!el) return;
          el.dispatchEvent(
            new MouseEvent("mouseover", {
              bubbles: true,
              cancelable: true,
              view: window,
            })
          );
          return;
        }

        case "click":
        case "expand": {
          const el = await waitForSelector(selector, {
            timeoutMs: 5000,
            intervalMs: 100,
            shouldContinue,
          });

          if (!el) {
            console.warn(`Demo action '${action.type}' target not found: ${selector}`);
            return;
          }

          safeClick(el);
          return;
        }

        case "wait":
          // no-op (the step timing is handled by audio/timers)
          return;

        case "navigate":
          // Not used in current demo scripts; avoid hard navigation side-effects.
          return;

        case "close-modal": {
          // Close any open modal by clicking the close button or pressing Escape
          const closeBtn = document.querySelector("[data-radix-dialog-close], [role='dialog'] button[aria-label='Close'], [role='dialog'] button:has(svg.lucide-x)");
          if (closeBtn) {
            safeClick(closeBtn);
            return;
          }
          // Fallback: press Escape key
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          return;
        }
      }
    };

    actions.forEach((action) => {
      const delay = action.delay ?? 0;
      const timeoutId = setTimeout(() => {
        void runAction(action);
      }, delay);
      timeoutsRef.current.push(timeoutId);
    });

    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, [state.isActive, state.isPlaying, currentStep?.id]);
}

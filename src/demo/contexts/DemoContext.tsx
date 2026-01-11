import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { DemoState, DemoContextType, DemoScript, DemoStep } from "../types";

const initialState: DemoState = {
  isActive: false,
  currentScript: null,
  currentStepIndex: 0,
  isPlaying: false,
  isPaused: false,
  speed: 1,
  volume: 0.8,
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = "demo-state";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => {
    // Restore saved preferences
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          speed: parsed.speed ?? 1,
          volume: parsed.volume ?? 0.8,
        };
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  // Save preferences
  useEffect(() => {
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        speed: state.speed,
        volume: state.volume,
      })
    );
  }, [state.speed, state.volume]);

  const startDemo = useCallback(
    (script: DemoScript) => {
      // Navigation is handled by the component that calls startDemo
      setState((prev) => ({
        ...prev,
        isActive: true,
        currentScript: script,
        currentStepIndex: 0,
        isPlaying: true,
        isPaused: false,
      }));
    },
    []
  );

  const stopDemo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentScript: null,
      currentStepIndex: 0,
      isPlaying: false,
      isPaused: false,
    }));
  }, []);

  const pauseDemo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));
  }, []);

  const resumeDemo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.currentScript) return prev;

      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= prev.currentScript.steps.length) {
        // Demo completed
        return {
          ...prev,
          isActive: false,
          currentScript: null,
          currentStepIndex: 0,
          isPlaying: false,
          isPaused: false,
        };
      }

      return {
        ...prev,
        currentStepIndex: nextIndex,
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => {
      if (!prev.currentScript || prev.currentStepIndex === 0) return prev;

      return {
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1,
      };
    });
  }, []);

  const goToStep = useCallback((index: number) => {
    setState((prev) => {
      if (!prev.currentScript) return prev;
      if (index < 0 || index >= prev.currentScript.steps.length) return prev;

      return {
        ...prev,
        currentStepIndex: index,
      };
    });
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume }));
  }, []);

  const currentStep: DemoStep | null =
    state.currentScript?.steps[state.currentStepIndex] ?? null;

  const progress =
    state.currentScript && state.currentScript.steps.length > 0
      ? ((state.currentStepIndex + 1) / state.currentScript.steps.length) * 100
      : 0;

  return (
    <DemoContext.Provider
      value={{
        state,
        startDemo,
        stopDemo,
        pauseDemo,
        resumeDemo,
        nextStep,
        previousStep,
        goToStep,
        setSpeed,
        setVolume,
        currentStep,
        progress,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}

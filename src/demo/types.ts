import { Language } from "@/i18n/translations";

export type HighlightType = "spotlight" | "border" | "pulse" | "arrow";

export type DemoActionType = "click" | "expand" | "scroll" | "hover" | "wait" | "navigate";

export interface DemoAction {
  type: DemoActionType;
  target?: string;
  delay?: number;
  value?: string;
}

export interface DemoStepContent {
  shortText: string;
  narrative: string;
  audioUrl?: string;
}

export interface DemoStep {
  id: string;
  elementSelector: string;
  content: Record<Language, DemoStepContent>;
  highlightType: HighlightType;
  actions?: DemoAction[];
  duration: number;
  position?: "top" | "bottom" | "left" | "right" | "auto";
  waitForElement?: boolean; // Wait for element to appear before starting step
}

export interface DemoScript {
  id: string;
  page: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  steps: DemoStep[];
}

export interface DemoState {
  isActive: boolean;
  currentScript: DemoScript | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  volume: number;
}

export interface DemoContextType {
  state: DemoState;
  startDemo: (script: DemoScript) => void;
  stopDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  currentStep: DemoStep | null;
  progress: number;
}

export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

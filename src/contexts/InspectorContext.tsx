import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ClickedElementInfo {
  selector: string;
  tagName: string;
  className: string;
  id?: string;
  textContent?: string;
  dataAttributes: Record<string, string>;
  rect: { top: number; left: number; width: number; height: number };
}

interface InspectorState {
  isActive: boolean;
  isSidebarOpen: boolean;
  clickedElement: ClickedElementInfo | null;
  question: string;
}

interface InspectorContextType {
  state: InspectorState;
  toggleInspector: () => void;
  deactivateInspector: () => void;
  setClickedElement: (element: ClickedElementInfo | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setQuestion: (question: string) => void;
}

const InspectorContext = createContext<InspectorContextType | null>(null);

export function InspectorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InspectorState>({
    isActive: false,
    isSidebarOpen: false,
    clickedElement: null,
    question: "",
  });

  const toggleInspector = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: !prev.isActive,
      clickedElement: prev.isActive ? null : prev.clickedElement,
    }));
  }, []);

  const deactivateInspector = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const setClickedElement = useCallback((element: ClickedElementInfo | null) => {
    setState(prev => ({
      ...prev,
      clickedElement: element,
      isSidebarOpen: element ? true : prev.isSidebarOpen,
    }));
  }, []);

  const openSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSidebarOpen: true,
    }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSidebarOpen: false,
      isActive: false,
      clickedElement: null,
      question: "",
    }));
  }, []);

  const setQuestion = useCallback((question: string) => {
    setState(prev => ({
      ...prev,
      question,
    }));
  }, []);

  return (
    <InspectorContext.Provider
      value={{
        state,
        toggleInspector,
        deactivateInspector,
        setClickedElement,
        openSidebar,
        closeSidebar,
        setQuestion,
      }}
    >
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector() {
  const context = useContext(InspectorContext);
  if (!context) {
    throw new Error("useInspector must be used within an InspectorProvider");
  }
  return context;
}

export type { ClickedElementInfo };

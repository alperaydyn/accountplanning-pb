import { useEffect, useState, useCallback } from "react";
import { useInspector, type ClickedElementInfo } from "@/contexts/InspectorContext";

export function InspectorOverlay() {
  const { state, setClickedElement, deactivateInspector } = useInspector();
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const getSelector = useCallback((element: HTMLElement): string => {
    if (element.id) return `#${element.id}`;
    
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        parts.unshift(selector);
        break;
      }
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentElement;
    }
    
    return parts.join(' > ');
  }, []);

  const getDataAttributes = useCallback((element: HTMLElement): Record<string, string> => {
    const dataAttrs: Record<string, string> = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }
    return dataAttrs;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.isActive) return;
    
    const target = e.target as HTMLElement;
    
    // Ignore our own overlay elements
    if (target.closest('[data-inspector-overlay]')) return;
    
    const rect = target.getBoundingClientRect();
    setHoveredRect(rect);
  }, [state.isActive]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!state.isActive) return;
    
    const target = e.target as HTMLElement;
    
    // Ignore our own overlay elements
    if (target.closest('[data-inspector-overlay]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = target.getBoundingClientRect();
    
    const elementInfo: ClickedElementInfo = {
      selector: getSelector(target),
      tagName: target.tagName.toLowerCase(),
      className: target.className || '',
      id: target.id || undefined,
      textContent: target.textContent?.substring(0, 200) || undefined,
      dataAttributes: getDataAttributes(target),
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    };
    
    setClickedElement(elementInfo);
    deactivateInspector();
    setHoveredRect(null);
  }, [state.isActive, getSelector, getDataAttributes, setClickedElement, deactivateInspector]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && state.isActive) {
      deactivateInspector();
      setHoveredRect(null);
    }
  }, [state.isActive, deactivateInspector]);

  useEffect(() => {
    if (state.isActive) {
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.cursor = 'crosshair';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [state.isActive, handleMouseMove, handleClick, handleKeyDown]);

  if (!state.isActive || !hoveredRect) return null;

  return (
    <div data-inspector-overlay className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Highlight box */}
      <div
        className="absolute border-2 border-primary bg-primary/10 transition-all duration-75 rounded-sm"
        style={{
          top: hoveredRect.top,
          left: hoveredRect.left,
          width: hoveredRect.width,
          height: hoveredRect.height,
        }}
      />
      
      {/* Tooltip showing element info */}
      <div
        className="absolute bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border max-w-xs truncate"
        style={{
          top: Math.max(0, hoveredRect.top - 28),
          left: hoveredRect.left,
        }}
      >
        Click to ask about this element
      </div>
    </div>
  );
}

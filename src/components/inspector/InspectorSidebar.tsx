import { useState, useRef, useEffect } from "react";
import { X, Send, ThumbsUp, ThumbsDown, Loader2, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useInspector } from "@/contexts/InspectorContext";
import { useRAGChat } from "@/hooks/useRAGChat";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function InspectorSidebar() {
  const { state, closeSidebar, setQuestion } = useInspector();
  const { messages, isLoading, isBlocked, blockedUntil, sendMessage, submitFeedback, clearMessages } = useRAGChat({
    clickedElement: state.clickedElement,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (state.isSidebarOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isSidebarOpen]);

  // Clear messages when sidebar closes
  useEffect(() => {
    if (!state.isSidebarOpen) {
      clearMessages();
    }
  }, [state.isSidebarOpen, clearMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isBlocked) return;
    
    const question = input.trim();
    setInput("");
    setQuestion(question);
    await sendMessage(question);
  };

  if (!state.isSidebarOpen) return null;

  return (
    <div 
      data-inspector-overlay
      className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border z-[9997] flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Help Inspector</span>
        </div>
        <Button variant="ghost" size="icon" onClick={closeSidebar}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Element info if clicked */}
      {state.clickedElement && (
        <div className="p-3 bg-muted/50 border-b border-border">
          <div className="text-xs text-muted-foreground mb-1">Selected Element</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {state.clickedElement.tagName}
            </Badge>
            {state.clickedElement.id && (
              <Badge variant="secondary" className="text-xs font-mono">
                #{state.clickedElement.id}
              </Badge>
            )}
          </div>
          {state.clickedElement.textContent && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {state.clickedElement.textContent.substring(0, 100)}...
            </p>
          )}
        </div>
      )}

      {/* Blocked warning */}
      {isBlocked && blockedUntil && (
        <div className="p-3 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            Blocked until {blockedUntil.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {state.clickedElement 
                ? "Ask a question about the selected element"
                : "Ask any question about the app"}
            </p>
            <p className="text-xs mt-2 opacity-70">
              Examples: "What does this show?", "How is this calculated?"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Feedback buttons for assistant messages */}
                {message.role === "assistant" && message.feedbackId && (
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        message.feedbackScore === 1 && "text-success"
                      )}
                      onClick={() => submitFeedback(message.id, 1)}
                      disabled={message.feedbackScore !== null}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        message.feedbackScore === -1 && "text-destructive"
                      )}
                      onClick={() => submitFeedback(message.id, -1)}
                      disabled={message.feedbackScore !== null}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                    {message.queryType && message.queryType !== 'business' && message.queryType !== 'technical' && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {message.queryType === 'out_of_context' ? 'Out of scope' : 'Needs review'}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Temporarily blocked..." : "Ask a question..."}
            disabled={isLoading || isBlocked}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading || isBlocked}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

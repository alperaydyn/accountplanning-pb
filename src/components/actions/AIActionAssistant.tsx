import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: CustomerSuggestion[];
}

interface CustomerSuggestion {
  customerId: string;
  customerName: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface AIActionAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIActionAssistant({ isOpen, onClose }: AIActionAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I can help you find the best customers to focus on today. Tell me what you're looking for - for example:\n\n• \"Which customers should I prioritize this week?\"\n• \"Find customers in the retail sector with high potential\"\n• \"Who needs follow-up on credit products?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateSuggestions = (query: string): CustomerSuggestion[] => {
    // Simple keyword-based matching for demo purposes
    const queryLower = query.toLowerCase();
    let filteredCustomers = [...customers];

    // Filter by sector if mentioned
    const sectors = ["turizm", "ulaşım", "perakende", "gayrimenkul", "tarım", "sağlık", "enerji", "retail", "tourism", "transport", "health", "energy", "agriculture", "real estate"];
    const sectorMap: Record<string, string> = {
      "retail": "Perakende",
      "tourism": "Turizm",
      "transport": "Ulaşım",
      "health": "Sağlık",
      "energy": "Enerji",
      "agriculture": "Tarım Hayvancılık",
      "real estate": "Gayrimenkul",
    };
    
    for (const sector of sectors) {
      if (queryLower.includes(sector)) {
        const mappedSector = sectorMap[sector] || sector.charAt(0).toUpperCase() + sector.slice(1);
        filteredCustomers = filteredCustomers.filter(c => 
          c.sector.toLowerCase().includes(sector) || c.sector === mappedSector
        );
        break;
      }
    }

    // Filter by segment if mentioned
    if (queryLower.includes("mikro") || queryLower.includes("micro")) {
      filteredCustomers = filteredCustomers.filter(c => c.segment === "MİKRO");
    } else if (queryLower.includes("ticari") || queryLower.includes("commercial")) {
      filteredCustomers = filteredCustomers.filter(c => c.segment === "TİCARİ");
    } else if (queryLower.includes("obi") || queryLower.includes("sme")) {
      filteredCustomers = filteredCustomers.filter(c => c.segment === "OBİ");
    }

    // Filter by status if mentioned
    if (queryLower.includes("target") || queryLower.includes("hedef")) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.status === "Target" || c.status === "Strong Target"
      );
    } else if (queryLower.includes("active") || queryLower.includes("aktif")) {
      filteredCustomers = filteredCustomers.filter(c => c.status === "Aktif");
    } else if (queryLower.includes("new") || queryLower.includes("yeni")) {
      filteredCustomers = filteredCustomers.filter(c => c.status === "Yeni Müşteri");
    }

    // Prioritize by principality score
    filteredCustomers.sort((a, b) => (b.principality_score || 0) - (a.principality_score || 0));

    // Take top 5
    return filteredCustomers.slice(0, 5).map((customer, index) => ({
      customerId: customer.id,
      customerName: customer.name,
      reason: `${customer.segment} segment, ${customer.sector} sector${customer.principality_score ? `, ${customer.principality_score}% principality score` : ""}`,
      priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const suggestions = generateSuggestions(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: suggestions.length > 0
        ? `Based on your request, here are the top ${suggestions.length} customers I recommend focusing on:`
        : "I couldn't find any customers matching your criteria. Try broadening your search or asking about a different segment or sector.",
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const priorityColors = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-muted text-muted-foreground border-border",
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-base">AI Action Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Find the best customers to focus on</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="p-1.5 rounded-full bg-violet-500/10 h-fit">
                    <Bot className="h-4 w-4 text-violet-500" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <Link
                          key={suggestion.customerId}
                          to={`/customers/${suggestion.customerId}`}
                          className={`block p-2 rounded border hover:bg-background/80 transition-colors ${priorityColors[suggestion.priority]}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm">
                              {index + 1}. {suggestion.customerName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${priorityColors[suggestion.priority]}`}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1 opacity-80">{suggestion.reason}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="p-1.5 rounded-full bg-violet-500/10 h-fit">
                  <Bot className="h-4 w-4 text-violet-500" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your portfolio...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about customers to focus on..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

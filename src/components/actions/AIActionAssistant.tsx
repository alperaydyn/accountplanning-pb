import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Send, X, Loader2, User, Bot, ShieldCheck, ChevronDown, ChevronUp, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerProducts } from "@/hooks/useAllCustomerProducts";
import { useProducts } from "@/hooks/useProducts";
import { useActions } from "@/hooks/useActions";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  customerMapping?: Record<string, string>; // tempId -> realId
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface AIActionAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

// GPT-5-mini pricing (per 1M tokens) - estimate
const PRICING = {
  input: 0.15, // $0.15 per 1M input tokens
  output: 0.60, // $0.60 per 1M output tokens
};

export function AIActionAssistant({ isOpen, onClose }: AIActionAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Merhaba! Bugün hangi müşterilere odaklanmanız gerektiğini bulmanıza yardımcı olabilirim. Örneğin:\n\n• \"Bu hafta hangi müşterilere öncelik vermeliyim?\"\n• \"Perakende sektöründeki yüksek potansiyelli müşterileri bul\"\n• \"Kredi ürünleri için takip gereken müşteriler kim?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [totalUsage, setTotalUsage] = useState({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: customers = [] } = useCustomers();
  const { data: customerProducts = [] } = useAllCustomerProducts();
  const { data: products = [] } = useProducts();
  const { data: actions = [] } = useActions();

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

  // Generate temporary IDs and prepare customer data with products and actions
  const preparedCustomerData = useMemo(() => {
    return customers.map((customer, index) => {
      const tempId = `C${index + 1}`;
      const customerProductList = customerProducts
        .filter((cp) => cp.customer_id === customer.id)
        .map((cp) => {
          const product = products.find((p) => p.id === cp.product_id);
          return {
            name: product?.name || "Unknown",
            category: product?.category || "Unknown",
            current_value: cp.current_value || 0,
          };
        });

      const customerActions = actions
        .filter((a) => a.customer_id === customer.id)
        .map((a) => ({
          name: a.name,
          description: a.description,
          priority: a.priority,
          status: a.current_status,
        }));

      return {
        id: customer.id,
        tempId,
        segment: customer.segment,
        sector: customer.sector,
        status: customer.status,
        principality_score: customer.principality_score,
        products: customerProductList,
        actions: customerActions,
      };
    });
  }, [customers, customerProducts, products, actions]);

  // Create mapping from tempId to realId
  const tempIdToRealId = useMemo(() => {
    const mapping: Record<string, string> = {};
    preparedCustomerData.forEach((c) => {
      mapping[c.tempId] = c.id;
    });
    return mapping;
  }, [preparedCustomerData]);

  // Parse AI response to find customer references and create links
  const parseResponseWithLinks = (content: string, mapping: Record<string, string>) => {
    // Match patterns like C1, C2, [C1], **C1**, etc.
    const regex = /\*?\*?\[?(C\d+)\]?\*?\*?/g;
    const parts: (string | { tempId: string; realId: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const tempId = match[1];
      const realId = mapping[tempId];

      if (realId) {
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index));
        }
        parts.push({ tempId, realId });
        lastIndex = regex.lastIndex;
      }
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
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

    try {
      // Prepare chat history (last 5 messages excluding welcome)
      const chatHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-5)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("ai-action-assistant", {
        body: {
          message: userMessage.content,
          customers: preparedCustomerData,
          chatHistory,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      setTotalUsage((prev) => ({
        prompt_tokens: prev.prompt_tokens + usage.prompt_tokens,
        completion_tokens: prev.completion_tokens + usage.completion_tokens,
        total_tokens: prev.total_tokens + usage.total_tokens,
      }));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        customerMapping: tempIdToRealId,
        usage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI assistant error:", error);
      toast.error("AI asistanla iletişim kurulamadı");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCost = (usage: { prompt_tokens: number; completion_tokens: number }) => {
    const inputCost = (usage.prompt_tokens / 1_000_000) * PRICING.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * PRICING.output;
    return inputCost + outputCost;
  };

  const renderMessageContent = (message: Message) => {
    if (message.role === "user" || !message.customerMapping) {
      return <p className="text-sm whitespace-pre-line">{message.content}</p>;
    }

    const parts = parseResponseWithLinks(message.content, message.customerMapping);

    return (
      <p className="text-sm whitespace-pre-line">
        {parts.map((part, index) => {
          if (typeof part === "string") {
            return <span key={index}>{part}</span>;
          }
          return (
            <Link
              key={index}
              to={`/customers/${part.realId}`}
              className="font-medium text-primary hover:underline"
            >
              {part.tempId}
            </Link>
          );
        })}
      </p>
    );
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

        {/* Privacy Notice */}
        <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 p-2.5">
          <button
            type="button"
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            className="flex items-center gap-2 w-full text-left"
          >
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground flex-1">
              Your customer identities are preserved
            </span>
            {showPrivacyDetails ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </button>

          {showPrivacyDetails && (
            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-1.5">
              <p>• Customer names are not directly shared with the AI</p>
              <p>• Undetectable one-time IDs are generated for each session separately</p>
              <p>• Incoming IDs are mapped to customers inside your browser session</p>
              <p>• Sensitive information in notes is masked before sending the prompt</p>
            </div>
          )}
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
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {renderMessageContent(message)}
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
                    Portföyünüz analiz ediliyor...
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
              placeholder="Odaklanılacak müşterileri sorun..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Token Counter & Cost */}
        <div className="border-t px-3 py-2 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">{totalUsage.total_tokens.toLocaleString()}</span> tokens
              </span>
              <span className="text-muted-foreground/60">
                (↑{totalUsage.prompt_tokens.toLocaleString()} / ↓{totalUsage.completion_tokens.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              <span className="font-medium">${calculateCost(totalUsage).toFixed(4)}</span>
              <span className="text-muted-foreground/60">est.</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

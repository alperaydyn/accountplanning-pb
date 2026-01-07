import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { 
  Sparkles, Send, Loader2, User, Bot, ShieldCheck, ChevronDown, ChevronUp, 
  Coins, Plus, Trash2, MessageSquare, MoreHorizontal 
} from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerProducts } from "@/hooks/useAllCustomerProducts";
import { useProducts } from "@/hooks/useProducts";
import { useActions } from "@/hooks/useActions";
import {
  useAIChatSessions,
  useAIChatMessages,
  useCreateChatSession,
  useUpdateChatSessionTitle,
  useDeleteChatSession,
  useAddChatMessage,
  ChatMessage,
} from "@/hooks/useAIChatSessions";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRICING = {
  input: 0.15,
  output: 0.60,
};

const WELCOME_MESSAGE = `Merhaba! Bugün hangi müşterilere odaklanmanız gerektiğini bulmanıza yardımcı olabilirim. Örneğin:

• "Bu hafta hangi müşterilere öncelik vermeliyim?"
• "Perakende sektöründeki yüksek potansiyelli müşterileri bul"
• "Kredi ürünleri için takip gereken müşteriler kim?"`;

export default function AIAssistant() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [totalUsage, setTotalUsage] = useState({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
  const [planMyDayTriggered, setPlanMyDayTriggered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useAIChatSessions();
  const { data: messages = [] } = useAIChatMessages(activeSessionId);
  const createSession = useCreateChatSession();
  const updateTitle = useUpdateChatSessionTitle();
  const deleteSession = useDeleteChatSession();
  const addMessage = useAddChatMessage();

  const { data: customers = [] } = useCustomers();
  const { data: customerProducts = [] } = useAllCustomerProducts();
  const { data: products = [] } = useProducts();
  const { data: actions = [] } = useActions();

  // Prepare customer data with temp IDs (moved up for early access)
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

  const tempIdToRealId = useMemo(() => {
    const mapping: Record<string, string> = {};
    preparedCustomerData.forEach((c) => {
      mapping[c.tempId] = c.id;
    });
    return mapping;
  }, [preparedCustomerData]);

  // Auto-select first session or create one
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, sessionsLoading, activeSessionId]);

  const sendMessage = async (sessionId: string, messageContent: string) => {
    setIsLoading(true);

    try {
      // Save user message
      await addMessage.mutateAsync({
        sessionId,
        role: "user",
        content: messageContent,
      });

      // Get chat history (last 5 messages)
      const chatHistory = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-action-assistant", {
        body: {
          message: messageContent,
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

      // Save assistant message
      await addMessage.mutateAsync({
        sessionId,
        role: "assistant",
        content: data.content,
        customerMapping: tempIdToRealId,
        usage: data.usage,
      });
    } catch (error) {
      console.error("AI assistant error:", error);
      toast.error("AI asistanla iletişim kurulamadı");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanMyDay = async () => {
    try {
      const session = await createSession.mutateAsync(undefined);
      setActiveSessionId(session.id);
      
      // Wait a tick for state to update, then send the message
      setTimeout(async () => {
        await sendMessage(session.id, "plan my day");
        updateTitle.mutate({ sessionId: session.id, title: "Günümü Planla" });
      }, 100);
    } catch (error) {
      toast.error("Yeni sohbet oluşturulamadı");
    }
  };

  // Handle "plan my day" trigger from URL
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt === "plan-my-day" && !planMyDayTriggered && !sessionsLoading && preparedCustomerData.length > 0) {
      setPlanMyDayTriggered(true);
      // Clear the URL param
      setSearchParams({}, { replace: true });
      // Create new session and send "plan my day"
      handlePlanMyDay();
    }
  }, [searchParams, sessionsLoading, planMyDayTriggered, preparedCustomerData]);

  // Calculate total usage from messages
  useEffect(() => {
    const usage = messages.reduce(
      (acc, msg) => {
        if (msg.usage) {
          acc.prompt_tokens += msg.usage.prompt_tokens;
          acc.completion_tokens += msg.usage.completion_tokens;
          acc.total_tokens += msg.usage.total_tokens;
        }
        return acc;
      },
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    );
    setTotalUsage(usage);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSessionId]);

  const parseResponseWithLinks = (content: string, mapping: Record<string, string> | null) => {
    if (!mapping) return [content];
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

  const handleNewSession = async () => {
    try {
      const session = await createSession.mutateAsync(undefined);
      setActiveSessionId(session.id);
    } catch (error) {
      toast.error("Yeni sohbet oluşturulamadı");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(sessions.find((s) => s.id !== sessionId)?.id || null);
      }
      toast.success("Sohbet silindi");
    } catch (error) {
      toast.error("Sohbet silinemedi");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSessionId) return;

    const userContent = input.trim();
    setInput("");

    // Update session title based on first user message
    if (messages.length === 0) {
      const title = userContent.slice(0, 50) + (userContent.length > 50 ? "..." : "");
      updateTitle.mutate({ sessionId: activeSessionId, title });
    }

    await sendMessage(activeSessionId, userContent);
  };

  const calculateCost = (usage: { prompt_tokens: number; completion_tokens: number }) => {
    const inputCost = (usage.prompt_tokens / 1_000_000) * PRICING.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * PRICING.output;
    return inputCost + outputCost;
  };

  const renderMessageContent = (message: ChatMessage) => {
    if (message.role === "user") {
      return <p className="text-sm whitespace-pre-line">{message.content}</p>;
    }

    const parts = parseResponseWithLinks(message.content, message.customer_mapping);

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

  const displayMessages = messages.length > 0 ? messages : [
    { id: "welcome", role: "assistant" as const, content: WELCOME_MESSAGE, customer_mapping: null, usage: null, session_id: "", created_at: "" }
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <PageBreadcrumb items={[{ label: "AI Assistant" }]} />
          <h1 className="text-2xl font-bold text-foreground">AI Action Assistant</h1>
          <p className="text-muted-foreground">Find the best customers to focus on</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
          {/* Sessions Sidebar */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Sohbet Geçmişi</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNewSession} disabled={createSession.isPending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      activeSessionId === session.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.updated_at), "d MMM, HH:mm")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {sessions.length === 0 && !sessionsLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz sohbet yok</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleNewSession}
                      className="mt-2"
                    >
                      Yeni sohbet başlat
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-violet-500/10">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">AI Action Assistant</CardTitle>
                    <p className="text-xs text-muted-foreground">GPT-5-Mini powered</p>
                  </div>
                </div>
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

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {displayMessages.map((message) => (
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
                      {message.id === "welcome" ? (
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      ) : (
                        renderMessageContent(message as ChatMessage)
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
                        Portföyünüz analiz ediliyor...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-3 shrink-0">
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
                  disabled={isLoading || !activeSessionId}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !activeSessionId}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Token Counter & Cost */}
            <div className="border-t px-3 py-2 bg-muted/20 shrink-0">
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
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

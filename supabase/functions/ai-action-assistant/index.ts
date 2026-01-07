import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerData {
  id: string;
  tempId: string; // One-time ID for privacy
  segment: string;
  sector: string;
  status: string;
  principality_score: number | null;
  products: { name: string; category: string; current_value: number }[];
  actions: { name: string; description: string | null; priority: string; status: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { message, customers, chatHistory } = await req.json();

    if (!message || !customers) {
      throw new Error("Missing required parameters: message, customers");
    }

    // Build customer context with temp IDs (privacy preserved)
    const customerContext = customers.map((c: CustomerData) => `
Customer ${c.tempId}:
- Segment: ${c.segment}, Sector: ${c.sector}, Status: ${c.status}
- Principality Score: ${c.principality_score || 0}%
- Products (${c.products.length}): ${c.products.map(p => `${p.name} (${p.category}, ${p.current_value.toLocaleString()} TL)`).join(", ") || "None"}
- Active Actions (${c.actions.length}): ${c.actions.map(a => `${a.name} [${a.priority}/${a.status}]`).join(", ") || "None"}`).join("\n");

    const systemPrompt = `You are an AI assistant helping a Relationship Manager (RM) prioritize customers for sales actions.

Your role is to analyze customer portfolios and recommend which customers to focus on based on the RM's query.

Available customer data uses temporary IDs for privacy (like C1, C2, etc.). Always refer to customers by their temp IDs.

When recommending customers:
1. Analyze their segment, sector, status, principality score, product ownership, and existing actions
2. Consider cross-sell opportunities (products they don't have yet)
3. Consider their engagement level (principality score)
4. Consider their status (Target/Strong Target = high potential)
5. Prioritize customers with fewer active actions (more capacity for new actions)

Always respond in Turkish. Be concise but informative.

When listing customers, format as:
- **[TempID]**: [Reason for recommendation]

Customer Portfolio:
${customerContext}`;

    // Build messages with history (max 5 previous messages)
    const recentHistory = (chatHistory || []).slice(-5);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received, usage:", data.usage);

    const content = data.choices?.[0]?.message?.content || "Üzgünüm, bir yanıt oluşturamadım.";
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return new Response(JSON.stringify({ 
      content,
      usage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in AI assistant:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

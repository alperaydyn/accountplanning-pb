import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductSummary {
  name: string;
  id: string;
  status: string;
  stockTar: number;
  flowTar: number;
  countTar: number;
  volumeTar: number;
  pendingActions: number;
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

    const { products } = await req.json();

    if (!products || !Array.isArray(products)) {
      throw new Error("Missing required parameter: products array");
    }

    // Optimize tokens: compact product summary
    const productSummaries = products.map((p: ProductSummary) => 
      `${p.name}|${p.status}|S:${p.stockTar}%|F:${p.flowTar}%|C:${p.countTar}%|V:${p.volumeTar}%|PA:${p.pendingActions}`
    ).join(";");

    const systemPrompt = `You are a banking portfolio AI analyst. Generate 1-3 actionable insights based on product performance data.

Insight types:
- critical: Urgent action needed (status critical/melting with low HGO%)
- warning: Needs attention (at_risk/growing/ticket_size/diversity status)
- info: Opportunities (high pending actions, growth potential)

Product statuses meaning:
- critical: Overall performance <50%
- at_risk: Performance 50-80%
- on_track: Performance ≥80%
- melting: Stock good, Flow bad (losing momentum)
- growing: Flow good, Stock bad (building up)
- ticket_size: Count good, Volume bad (small transactions)
- diversity: Volume good, Count bad (few large customers)

Data format: name|status|S:stockHGO%|F:flowHGO%|C:countHGO%|V:volumeHGO%|PA:pendingActions

Generate Turkish descriptions for insights. Be specific about product names.`;

    const userPrompt = `Products: ${productSummaries}

Generate insights focusing on:
1. Critical products requiring immediate action
2. Products with warning signs (melting/growing/ticket_size/diversity)
3. Opportunities from pending actions or growth patterns

IMPORTANT: Call generate_insights tool with your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Generate portfolio insights based on product performance",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["critical", "warning", "info"] },
                        title: { type: "string", description: "Short title in English (max 5 words)" },
                        message: { type: "string", description: "Brief message in English describing the issue" },
                        detailedDescription: { type: "string", description: "Detailed explanation in Turkish with recommended actions" },
                        productIds: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Array of product IDs related to this insight"
                        },
                      },
                      required: ["type", "title", "message", "detailedDescription", "productIds"],
                      additionalProperties: false,
                    },
                    minItems: 1,
                    maxItems: 3,
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
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
    console.log("AI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in response:", JSON.stringify(data, null, 2));
      throw new Error("No valid response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ insights: result.insights || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

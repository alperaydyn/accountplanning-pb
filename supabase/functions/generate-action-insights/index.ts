import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionSummary {
  totalActions: number;
  plannedActions: number;
  pendingActions: number;
  completedActions: number;
  actionsByProduct: { productName: string; count: number; status: string }[];
  actionsByCustomerStatus: { status: string; count: number }[];
  criticalProductActions: { productName: string; count: number }[];
  nonPrimaryCustomerActions: number;
  recordMonth: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);
    // === End Authentication Check ===

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { actionSummary } = await req.json() as { actionSummary: ActionSummary };

    if (!actionSummary) {
      throw new Error("Missing required parameter: actionSummary");
    }

    const systemPrompt = `Sen bir banka portföy yöneticisi asistanısın. Aksiyon planlaması ve kalitesi hakkında 1-3 içgörü üret.

İçgörü türleri:
- critical: Acil aksiyon gerekli (yetersiz planlama, kritik ürünlere odaklanma eksikliği)
- warning: Dikkat gerekli (dengesiz dağılım, ana banka olmayan müşterilere yetersiz odaklanma)
- info: Fırsatlar veya pozitif geri bildirim

DEĞERLENDİRME KRİTERLERİ:
1. Aksiyon Yeterliliği: Seçilen ay için planlanan aksiyonlar hedeflere ulaşmak için yeterli mi?
2. Kritik Ürün Uyumu: Aksiyonlar kritik/riskli ürünlere yeterince odaklanıyor mu?
3. Müşteri Dengesi: Ana banka olmayan müşterilere yeterince aksiyon planlanmış mı?
4. Aksiyon Kalitesi: Bekleyen aksiyonlar çok mu fazla? Tamamlanan oran nasıl?

KURALLAR:
- Teknik detaylar kullanma
- Somut ve uygulanabilir öneriler ver
- İş diline uygun yaz
- Pozitif durumları da belirt`;

    const actionsByProductSummary = actionSummary.actionsByProduct
      .slice(0, 10)
      .map(p => `${p.productName}:${p.count}(${p.status})`)
      .join(";");

    const customerStatusSummary = actionSummary.actionsByCustomerStatus
      .map(c => `${c.status}:${c.count}`)
      .join(";");

    const criticalProductsSummary = actionSummary.criticalProductActions
      .map(p => `${p.productName}:${p.count}`)
      .join(";");

    const userPrompt = `Aksiyon Özeti (${actionSummary.recordMonth}):
- Toplam: ${actionSummary.totalActions}
- Planlandı: ${actionSummary.plannedActions}
- Beklemede: ${actionSummary.pendingActions}
- Tamamlandı: ${actionSummary.completedActions}

Ürünlere göre: ${actionsByProductSummary || "Yok"}
Müşteri durumuna göre: ${customerStatusSummary || "Yok"}
Kritik ürünlerdeki aksiyonlar: ${criticalProductsSummary || "Yok"}
Ana banka olmayan müşterilere aksiyonlar: ${actionSummary.nonPrimaryCustomerActions}

generate_action_insights aracını çağır.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_action_insights",
              description: "Generate action planning insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["critical", "warning", "info"] },
                        title: { type: "string", description: "Kısa başlık Türkçe (max 5 kelime)" },
                        message: { type: "string", description: "Kısa açıklama Türkçe" },
                        detailedDescription: { type: "string", description: "Detaylı açıklama ve önerilen aksiyonlar Türkçe" },
                        category: { 
                          type: "string", 
                          enum: ["sufficiency", "alignment", "balance", "quality"],
                          description: "İçgörü kategorisi"
                        },
                      },
                      required: ["type", "title", "message", "detailedDescription", "category"],
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
        tool_choice: { type: "function", function: { name: "generate_action_insights" } },
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
    console.error("Error generating action insights:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

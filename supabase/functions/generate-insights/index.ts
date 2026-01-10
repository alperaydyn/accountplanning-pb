import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { products } = await req.json();

    if (!products || !Array.isArray(products)) {
      throw new Error("Missing required parameter: products array");
    }

    // Build product name to ID mapping for the response
    const productMap = products.reduce((acc: Record<string, string>, p: ProductSummary) => {
      acc[p.name] = p.id;
      return acc;
    }, {});

    // Optimize tokens: compact product summary (no IDs in prompt)
    const productSummaries = products.map((p: ProductSummary) => 
      `${p.name}|${p.status}|PA:${p.pendingActions}`
    ).join(";");

const systemPrompt = `Sen bir banka portföy analisti AI'sın. Ürün performans verilerine göre 1-3 aksiyon odaklı içgörü üret.

İçgörü türleri:
- critical: Acil aksiyon gerekli (kritik veya eriyen ürünler)
- warning: Dikkat gerekli (riskli, büyüyen, işlem boyutu veya çeşitlilik sorunları)
- info: Fırsatlar (bekleyen aksiyonlar, büyüme potansiyeli)

Durum açıklamaları:
- kritik: Genel performans düşük
- riskli: Performans orta seviyede
- hedefe uygun: Performans iyi
- eriyen: Stok iyi ama akış düşük (momentum kaybı)
- büyüyen: Akış iyi ama stok düşük (gelişme aşamasında)
- işlem boyutu: Müşteri sayısı iyi ama hacim düşük (küçük işlemler)
- çeşitlilik: Hacim iyi ama müşteri sayısı düşük (az sayıda büyük müşteri)

YAPILANDIRMA KURALLARI:
- message: Kısa özet (maksimum 15 kelime)
- analysis: Mevcut durumun kısa analizi (2-3 cümle, düz metin)
- recommendations: 2-4 maddelik somut aksiyon önerileri listesi (her biri kısa ve net)

DİL KURALLARI:
- Teknik detaylar kullanma (ID'ler, yüzdeler vb.)
- Ürün isimlerini aynen kullan
- İş diliyle yaz, profesyonel tonda`;

    const userPrompt = `Ürünler: ${productSummaries}

Şunlara odaklan:
1. Acil müdahale gerektiren kritik ürünler
2. Uyarı işaretleri olan ürünler (eriyen/büyüyen/işlem boyutu/çeşitlilik)
3. Bekleyen aksiyonlardan veya büyüme kalıplarından fırsatlar

generate_insights aracını çağır.`;

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
                        title: { type: "string", description: "Kısa başlık Türkçe (max 5 kelime)" },
                        message: { type: "string", description: "Özet cümle Türkçe (max 15 kelime)" },
                        analysis: { type: "string", description: "Mevcut durum analizi Türkçe (2-3 cümle)" },
                        recommendations: { 
                          type: "array", 
                          items: { type: "string", description: "Somut aksiyon önerisi (kısa ve net)" },
                          description: "Önerilen aksiyonlar listesi",
                          minItems: 2,
                          maxItems: 4
                        },
                        productNames: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Bu içgörüyle ilgili ürün isimleri (tam olarak verildiği gibi)"
                        },
                      },
                      required: ["type", "title", "message", "analysis", "recommendations", "productNames"],
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

    // Map product names to IDs for frontend linking
    const insightsWithIds = (result.insights || []).map((insight: any) => ({
      ...insight,
      products: (insight.productNames || []).map((name: string) => ({
        name,
        id: productMap[name] || null,
      })),
    }));

    return new Response(JSON.stringify({ insights: insightsWithIds }), {
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

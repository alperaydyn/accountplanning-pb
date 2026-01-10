import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerProduct {
  name: string;
  category: string;
  current_value: number;
  threshold: number;
  gap: number;
}

interface CustomerData {
  id: string;
  tempId: string;
  name: string;
  segment: string;
  sector: string;
  status: string;
  principality_score: number | null;
  products: CustomerProduct[];
  belowThresholdProducts: CustomerProduct[];
  actions: { name: string; description: string | null; priority: string; status: string }[];
}

interface ActionTemplate {
  productId: string;
  productName: string;
  actionName: string;
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

    const { message, customers, actionTemplates, chatHistory } = await req.json();

    if (!message || !customers) {
      throw new Error("Missing required parameters: message, customers");
    }

    // Check if this is a "plan my day" request
    const isPlanMyDay = message.toLowerCase().includes("plan my day") || 
                        message.toLowerCase().includes("günümü planla");

    let systemPrompt: string;

    if (isPlanMyDay) {
      // Build action templates context
      const templatesContext = (actionTemplates || [])
        .map((t: ActionTemplate) => `${t.productName}: ${t.actionName}`)
        .join("\n");

      // Build customer context with below-threshold products
      const customerContext = customers
        .filter((c: CustomerData) => c.belowThresholdProducts && c.belowThresholdProducts.length > 0)
        .slice(0, 20) // Limit to top 20 customers with gaps
        .map((c: CustomerData) => {
          const gaps = c.belowThresholdProducts
            .map(p => `${p.name}(açık:${Math.round(p.gap/1000)}K)`)
            .join(", ");
          return `${c.tempId}: ${c.status}, PS:${c.principality_score || 0}%, Açıklar: ${gaps}`;
        })
        .join("\n");

      systemPrompt = `Sen bir Portföy Yöneticisine günlük satış planı hazırlayan AI asistanısın.

GÖREV: Bugün odaklanılacak EN İYİ 5 müşteriyi seç ve her biri için 2-3 aksiyon öner.

MÜŞTERİ VERİLERİ:
${customerContext}

MEVCUT AKSİYON ŞABLONLARI:
${templatesContext}

YANIT FORMATI (JSON):
{
  "greeting": "Gününüz planlanıyor! 🚀",
  "customers": [
    {
      "tempId": "C1",
      "reason": "Neden bu müşteri seçildi (max 15 kelime)",
      "actions": [
        {"product": "Ürün Adı", "action": "Aksiyon Adı", "note": "Kısa not (max 10 kelime)"}
      ]
    }
  ],
  "summary": "Günlük hedef özeti (max 20 kelime)"
}

KURALLAR:
- Sadece JSON döndür, başka açıklama yazma
- Her müşteri için 2-3 aksiyon öner
- Aksiyonları mevcut şablonlardan seç
- Yüksek PS skorlu ve büyük açığı olan müşterileri öncelikle seç
- "Strong Target" ve "Target" statüsündeki müşterileri tercih et`;

    } else {
      // Regular query - simplified context
      const customerContext = customers.map((c: CustomerData) => `
${c.tempId}: ${c.segment}/${c.sector}, ${c.status}, PS:${c.principality_score || 0}%
Ürünler: ${c.products.map(p => p.name).join(", ") || "Yok"}
Açıklar: ${c.belowThresholdProducts?.map(p => `${p.name}(${Math.round(p.gap/1000)}K)`).join(", ") || "Yok"}`).join("\n");

      systemPrompt = `Sen bir Portföy Yöneticisine müşteri önceliklendirmede yardım eden AI asistanısın.

Müşteri Portföyü:
${customerContext}

Kısa ve öz yanıtlar ver. Müşterileri tempId ile referans göster (C1, C2 vb.).
Türkçe yanıt ver.`;
    }

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
      isPlanMyDay,
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

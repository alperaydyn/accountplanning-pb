import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default models per provider
const DEFAULT_MODELS: Record<string, string> = {
  lovable: 'openai/gpt-5-mini',
  openai: 'gpt-4o-mini',
  openrouter: 'anthropic/claude-3.5-sonnet',
  local: 'llama3',
};

// API endpoints per provider
const ENDPOINTS: Record<string, string> = {
  lovable: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

interface AIProviderConfig {
  provider: string;
  model: string | null;
  apiKey: string | null;
  baseUrl: string | null;
}

async function callAI(config: AIProviderConfig, messages: any[], tools?: any[], toolChoice?: any) {
  const { provider, model, apiKey, baseUrl } = config;
  
  let resolvedApiKey: string = '';
  if (provider === 'lovable') {
    resolvedApiKey = Deno.env.get('LOVABLE_API_KEY') || '';
  } else if (apiKey) {
    resolvedApiKey = apiKey;
  } else {
    const envKeyMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      local: '',
    };
    resolvedApiKey = Deno.env.get(envKeyMap[provider] || '') || '';
  }
  
  let endpoint: string;
  if (provider === 'local') {
    if (!baseUrl) throw new Error('Local provider requires a base URL');
    endpoint = baseUrl.endsWith('/v1/chat/completions') 
      ? baseUrl 
      : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  } else {
    endpoint = ENDPOINTS[provider] || ENDPOINTS.lovable;
  }
  
  const resolvedModel = model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.lovable;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (resolvedApiKey) headers['Authorization'] = `Bearer ${resolvedApiKey}`;
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lovable.dev';
    headers['X-Title'] = 'Account Planning App';
  }
  
  const body: any = { model: resolvedModel, messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;
  
  console.log(`Calling AI: provider=${provider}, model=${resolvedModel}`);
  
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  
  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Payment required' };
    const errorText = await response.text();
    throw new Error(`AI error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
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

    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Fetch user's AI provider settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('ai_provider, ai_model, ai_api_key_encrypted, ai_base_url')
      .eq('user_id', userId)
      .maybeSingle();

    const aiConfig: AIProviderConfig = {
      provider: userSettings?.ai_provider || 'lovable',
      model: userSettings?.ai_model || null,
      apiKey: userSettings?.ai_api_key_encrypted || null,
      baseUrl: userSettings?.ai_base_url || null,
    };

    const { products } = await req.json();

    if (!products || !Array.isArray(products)) {
      throw new Error("Missing required parameter: products array");
    }

    const productMap = products.reduce((acc: Record<string, string>, p: ProductSummary) => {
      acc[p.name] = p.id;
      return acc;
    }, {});

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

    const tools = [
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
    ];

    const data = await callAI(
      aiConfig,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools,
      { type: "function", function: { name: "generate_insights" } }
    );

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in response:", JSON.stringify(data, null, 2));
      throw new Error("No valid response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    const insightsWithIds = (result.insights || []).map((insight: any) => ({
      ...insight,
      products: (insight.productNames || []).map((name: string) => ({
        name,
        id: productMap[name] || null,
      })),
    }));

    return new Response(JSON.stringify({ 
      insights: insightsWithIds,
      provider: aiConfig.provider,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating insights:", error);
    
    if (error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required. Please add funds to your workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

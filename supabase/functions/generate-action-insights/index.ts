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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

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

YAPILANDIRMA KURALLARI:
- message: Kısa özet (maksimum 15 kelime)
- analysis: Mevcut durumun kısa analizi (2-3 cümle, düz metin)
- recommendations: 2-4 maddelik somut aksiyon önerileri listesi (her biri kısa ve net)

DİL KURALLARI:
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

    const tools = [
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
                    message: { type: "string", description: "Özet cümle Türkçe (max 15 kelime)" },
                    analysis: { type: "string", description: "Mevcut durum analizi Türkçe (2-3 cümle)" },
                    recommendations: { 
                      type: "array", 
                      items: { type: "string", description: "Somut aksiyon önerisi (kısa ve net)" },
                      description: "Önerilen aksiyonlar listesi",
                      minItems: 2,
                      maxItems: 4
                    },
                    category: { 
                      type: "string", 
                      enum: ["sufficiency", "alignment", "balance", "quality"],
                      description: "İçgörü kategorisi"
                    },
                  },
                  required: ["type", "title", "message", "analysis", "recommendations", "category"],
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
      { type: "function", function: { name: "generate_action_insights" } }
    );

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in response:", JSON.stringify(data, null, 2));
      throw new Error("No valid response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ 
      insights: result.insights || [],
      provider: aiConfig.provider,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating action insights:", error);
    
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

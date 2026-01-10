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
  
  // Determine API key
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
  
  // Determine endpoint
  let endpoint: string;
  if (provider === 'local') {
    if (!baseUrl) throw new Error('Local provider requires a base URL');
    endpoint = baseUrl.endsWith('/v1/chat/completions') 
      ? baseUrl 
      : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  } else {
    endpoint = ENDPOINTS[provider] || ENDPOINTS.lovable;
  }
  
  // Determine model
  const resolvedModel = model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.lovable;
  
  // Build headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (resolvedApiKey) {
    headers['Authorization'] = `Bearer ${resolvedApiKey}`;
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lovable.dev';
    headers['X-Title'] = 'Account Planning App';
  }
  
  const body: any = { model: resolvedModel, messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;
  
  console.log(`Calling AI: provider=${provider}, model=${resolvedModel}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Payment required' };
    const errorText = await response.text();
    throw new Error(`AI error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("JWT validation failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

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

    const { message, customers, actionTemplates, chatHistory } = await req.json();

    if (!message || !customers) {
      throw new Error("Missing required parameters: message, customers");
    }

    // Check if this is a "plan my day" request and extract date if provided
    const isPlanMyDay = message.toLowerCase().includes("plan my day") || 
                        message.toLowerCase().includes("günümü planla");

    // Extract target date from message like "plan my day for 2026-01-15"
    const dateMatch = message.match(/for\s+(\d{4}-\d{2}-\d{2})/i);
    const targetDate = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];
    const isToday = targetDate === new Date().toISOString().split("T")[0];
    const dateLabel = isToday ? "Bugün" : targetDate;

    let systemPrompt: string;

    if (isPlanMyDay) {
      // Build action templates context (explicit product→action pairs)
      const templatesContext = (actionTemplates || [])
        .map((t: ActionTemplate) => `${t.productName} → ${t.actionName}`)
        .join("\n");

      const allowedProducts = Array.from(
        new Set((actionTemplates || []).map((t: ActionTemplate) => t.productName))
      ).join(", ");

      // Build customer context - prioritize by status and PS score
      const sortedCustomers = [...customers]
        .filter((c: CustomerData) => c.products && c.products.length > 0)
        .sort((a: CustomerData, b: CustomerData) => {
          const statusOrder: Record<string, number> = { "Strong Target": 0, "Target": 1, "Aktif": 2, "Ana Banka": 3, "Yeni Müşteri": 4 };
          const statusA = statusOrder[a.status] ?? 5;
          const statusB = statusOrder[b.status] ?? 5;
          if (statusA !== statusB) return statusA - statusB;
          return (b.principality_score || 0) - (a.principality_score || 0);
        })
        .slice(0, 20);

      const customerContext = sortedCustomers
        .map((c: CustomerData) => {
          const productList = c.products.map((p) => p.name).join(", ");
          const gaps = c.belowThresholdProducts?.length > 0
            ? c.belowThresholdProducts.map((p) => `${p.name}(açık:${Math.round(p.gap / 1000)}K)`).join(", ")
            : "Yok";
          return `${c.tempId}: ${c.status}, PS:${c.principality_score || 0}%, Ürünler: ${productList}, Açıklar: ${gaps}`;
        })
        .join("\n");

      systemPrompt = `Sen bir Portföy Yöneticisine günlük satış planı hazırlayan AI asistanısın.

GÖREV: ${dateLabel} için odaklanılacak EN İYİ 5 müşteriyi seç ve her biri için 2-3 aksiyon öner.

MÜŞTERİ VERİLERİ (ürün adlarını olduğu gibi kopyala):
${customerContext}

MEVCUT AKSİYON ŞABLONLARI (ÜRÜN → AKSİYON):
${templatesContext}

GEÇERLİ ÜRÜNLER (product alanı bunlardan BİREBİR olmalı):
${allowedProducts}

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

KURALLAR (ÇOK ÖNEMLİ):
- Sadece JSON döndür, başka açıklama yazma
- Her müşteri için 2-3 aksiyon öner (yeterli benzersiz ürün yoksa daha az yaz)
- "product" alanı: Yukarıdaki GEÇERLİ ÜRÜNLER listesinden BİREBİR aynı olmalı (kısaltma/çeviri/yeni isim YOK)
- "action" alanı: Seçtiğin product için yalnızca şablonlarda geçen aksiyon adlarından BİREBİR olmalı
- ÜRÜN-AKSİYON EŞLEŞMESİ KORUNACAK: (product, action) ikilisi şablonlarda bir satır olarak bulunmalı
- Aynı müşteri içinde ürün TEKRARI YOK: actions dizisinde aynı "product" iki kez geçemez
- Aksiyonları müşterinin sahip olduğu ürünlerden veya açık listesinden seç
- Yüksek PS skorlu müşterileri öncelikle seç
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

    const data = await callAI(aiConfig, messages);
    console.log("AI response received, usage:", data.usage);

    const content = data.choices?.[0]?.message?.content || "Üzgünüm, bir yanıt oluşturamadım.";
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return new Response(JSON.stringify({ 
      content,
      usage,
      isPlanMyDay,
      provider: aiConfig.provider,
      model: aiConfig.model || DEFAULT_MODELS[aiConfig.provider],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in AI assistant:", error);
    
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

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECTORS = ["Turizm", "Sağlık", "Enerji", "Perakende", "Ulaşım", "Gayrimenkul", "Tarım Hayvancılık"];
const SEGMENTS = ["TİCARİ", "OBİ", "Kİ", "MİKRO"];
const PRIORITIES = ["high", "medium", "low"];

const ACTION_NAMES = [
  "Increase credit limit",
  "Cross-sell deposit product",
  "Renew loan facility",
  "Upgrade card tier",
  "Offer insurance bundle",
  "Migrate to digital channels",
  "Consolidate accounts",
  "Propose FX hedging",
  "Introduce trade finance",
  "Expand investment portfolio",
];

// Default models per provider
const DEFAULT_MODELS: Record<string, string> = {
  lovable: 'google/gemini-2.5-flash',
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

    const { customer, products, ownedProductIds } = await req.json();

    if (!customer || !products || !ownedProductIds) {
      throw new Error("Missing required parameters: customer, products, ownedProductIds");
    }

    const ownedProducts = products.filter((p: { id: string }) => ownedProductIds.includes(p.id));
    const notOwnedProducts = products.filter((p: { id: string }) => !ownedProductIds.includes(p.id));

    const systemPrompt = `You are a commercial banking AI that generates actionable sales recommendations for relationship managers.

Based on customer profile and product ownership, generate 1-5 relevant actions that could increase customer value.

Available action names: ${ACTION_NAMES.join(", ")}
Available priorities: ${PRIORITIES.join(", ")}

Action generation rules by segment:
- TİCARİ (Large Corporate): Focus on trade finance, FX hedging, large credit facilities
- OBİ (Mid-size): Focus on growth financing, digital channels, insurance bundles
- Kİ (Small business): Focus on card products, deposit products, consolidation
- MİKRO (Micro): Focus on basic products, digital migration, simple insurance

Action generation rules by sector:
- Enerji/Gayrimenkul: Higher credit limits, project finance
- Turizm/Perakende: Seasonal credit, card products, POS solutions
- Sağlık: Insurance products, equipment leasing
- Tarım Hayvancılık: Agricultural credits, leasing, factoring
- Ulaşım: Fleet leasing, fuel cards

Product ownership analysis:
- If customer has credits but no insurance: Offer insurance bundle
- If customer has deposits but no investment: Expand investment portfolio
- If customer has limited products: Cross-sell deposit product
- If customer is using traditional channels: Migrate to digital channels

Generate actions that are RELEVANT to the customer's profile and current product ownership.
Each action should target a specific product from the available products list.`;

    const userPrompt = `Generate actions for this customer:

Customer Profile:
- Name: ${customer.name}
- Segment: ${customer.segment}
- Sector: ${customer.sector}
- Status: ${customer.status}
- Principality Score: ${customer.principality_score || 0}%

Currently Owned Products (${ownedProducts.length}):
${ownedProducts.map((p: { name: string; category: string }) => `- ${p.name} (${p.category})`).join("\n")}

Products Not Yet Owned (${notOwnedProducts.length}):
${notOwnedProducts.map((p: { name: string; category: string }) => `- ${p.name} (${p.category})`).join("\n")}

Available Products (for targeting actions):
${products.map((p: { id: string; name: string }) => `${p.id} -> ${p.name}`).join("\n")}

Generate 1-5 relevant actions based on this customer profile.
IMPORTANT: You MUST call the generate_actions tool with your response.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_actions",
          description: "Generate a list of recommended actions for the customer",
          parameters: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", enum: ACTION_NAMES },
                    product_id: { type: "string", description: "Target product ID" },
                    priority: { type: "string", enum: PRIORITIES },
                    description: { type: "string", description: "Brief description of why this action is recommended" },
                    creation_reason: { type: "string", description: "Detailed reason for creating this action" },
                    customer_hints: { type: "string", description: "Tips for approaching the customer about this action" },
                    target_value: { type: "number", description: "Target value in TL for this action" },
                  },
                  required: ["name", "product_id", "priority", "description", "creation_reason", "customer_hints", "target_value"],
                  additionalProperties: false,
                },
                minItems: 1,
                maxItems: 5,
              },
            },
            required: ["actions"],
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
      { type: "function", function: { name: "generate_actions" } }
    );

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in response:", JSON.stringify(data, null, 2));
      throw new Error("No valid response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    const validActions = (result.actions || []).map((action: any) => ({
      name: action.name,
      product_id: action.product_id,
      priority: action.priority,
      description: action.description,
      creation_reason: action.creation_reason,
      customer_hints: action.customer_hints,
      target_value: Math.round(Number(action.target_value) || 100000),
    }));

    return new Response(JSON.stringify({ 
      actions: validActions,
      provider: aiConfig.provider,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating actions:", error);
    
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

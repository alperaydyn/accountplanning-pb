import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default models per provider
const DEFAULT_MODELS: Record<string, string> = {
  lovable: 'google/gemini-3-flash-preview',
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, message: "Yetkilendirme gerekli" }), {
        status: 200,
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
      return new Response(JSON.stringify({ success: false, message: "Yetkilendirme hatası" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // === End Authentication Check ===

    const { provider, model, apiKey, baseUrl, testPrompt } = await req.json();

    if (!provider) {
      throw new Error("Missing required parameter: provider");
    }

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
      if (!baseUrl) {
        throw new Error('Local provider requires a base URL');
      }
      endpoint = baseUrl.endsWith('/v1/chat/completions') 
        ? baseUrl 
        : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
    } else {
      endpoint = ENDPOINTS[provider];
    }

    // Determine model
    const resolvedModel = model || DEFAULT_MODELS[provider];

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (resolvedApiKey) {
      headers['Authorization'] = `Bearer ${resolvedApiKey}`;
    }

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://lovable.dev';
      headers['X-Title'] = 'Account Planning App';
    }

    // Use custom test prompt or default
    const prompt = testPrompt || 'Say "OK" in one word.';
    const maxTokens = testPrompt ? 500 : 10;

    // Test request
    const body = {
      model: resolvedModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    };

    console.log(`Testing AI connection: provider=${provider}, model=${resolvedModel}, endpoint=${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI test failed:`, response.status, errorText);
      
      let errorMessage = 'Connection failed';
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 402) {
        errorMessage = 'Payment required';
      } else if (response.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (response.status === 404) {
        errorMessage = 'Model not found or endpoint invalid';
      } else {
        errorMessage = `Error ${response.status}: ${errorText.substring(0, 100)}`;
      }

      return new Response(JSON.stringify({ 
        success: false, 
        message: errorMessage,
        status: response.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response';

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Bağlantı başarılı (${resolvedModel})`,
      response: content,
      model: resolvedModel,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Test AI connection error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 200, // Return 200 so frontend can show the error message
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

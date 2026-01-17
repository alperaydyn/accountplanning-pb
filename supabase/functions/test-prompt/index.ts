import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODELS: Record<string, string> = {
  lovable: 'google/gemini-3-flash-preview',
  openai: 'gpt-5-mini',
  openrouter: 'openai/gpt-5-mini',
  local: 'llama3',
};

const ENDPOINTS: Record<string, string> = {
  lovable: 'https://ai-gateway.lovable.dev/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

interface AIProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

async function callAI(config: AIProviderConfig, messages: { role: string; content: string }[]): Promise<{ content: string; usage?: Record<string, number> }> {
  const { provider, model, apiKey, baseUrl } = config;
  
  let endpoint = ENDPOINTS[provider] || baseUrl;
  if (provider === 'local' && baseUrl) {
    endpoint = baseUrl.endsWith('/v1/chat/completions') 
      ? baseUrl 
      : `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  }
  
  if (!endpoint) {
    throw new Error(`No endpoint for provider: ${provider}`);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (provider === 'lovable') {
    headers['Authorization'] = `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    headers['x-lovable-project-id'] = Deno.env.get('LOVABLE_PROJECT_ID') || '';
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lovable.dev';
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || DEFAULT_MODELS[provider],
      messages,
      max_completion_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { promptText, testCases, templateName } = await req.json();

    // Get user's AI settings
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('ai_provider, ai_model, ai_api_key_encrypted, ai_base_url')
      .eq('user_id', user.id)
      .single();

    const aiConfig: AIProviderConfig = {
      provider: settings?.ai_provider || 'lovable',
      model: settings?.ai_model || DEFAULT_MODELS[settings?.ai_provider || 'lovable'],
      apiKey: settings?.ai_api_key_encrypted,
      baseUrl: settings?.ai_base_url,
    };

    const results: Array<{
      testCaseId: string;
      testCaseName: string;
      input: Record<string, unknown>;
      expectedOutput: Record<string, unknown>;
      actualOutput: Record<string, unknown> | null;
      passed: boolean | null;
      evaluationNotes: string;
      executionTimeMs: number;
      errorMessage: string | null;
    }> = [];

    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        // Build the prompt with test input
        const inputJson = JSON.stringify(testCase.input_data, null, 2);
        const systemPrompt = promptText;
        const userPrompt = `Input data:\n${inputJson}\n\nProcess this input according to your instructions and return a valid JSON response.`;

        const response = await callAI(aiConfig, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);

        const executionTime = Date.now() - startTime;
        
        // Try to parse the response as JSON
        let actualOutput: Record<string, unknown> | null = null;
        let parseError = false;
        
        try {
          // Try to extract JSON from the response
          const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) 
            || response.content.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            actualOutput = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            actualOutput = { raw_response: response.content };
            parseError = true;
          }
        } catch {
          actualOutput = { raw_response: response.content };
          parseError = true;
        }

        // Evaluate the result
        const evaluationPrompt = `You are evaluating an AI prompt test result.

Expected Output:
${JSON.stringify(testCase.expected_output, null, 2)}

Actual Output:
${JSON.stringify(actualOutput, null, 2)}

Evaluate if the actual output meets the expectations. Consider:
1. Are all required fields present?
2. Are the values in the expected format?
3. Does the logic/content match what was expected?

Respond with a JSON object:
{
  "passed": true/false,
  "notes": "Brief explanation of why it passed or failed"
}`;

        const evalResponse = await callAI(aiConfig, [
          { role: 'user', content: evaluationPrompt },
        ]);

        let passed: boolean | null = null;
        let evaluationNotes = '';
        
        try {
          const evalJson = evalResponse.content.match(/\{[\s\S]*\}/);
          if (evalJson) {
            const evalResult = JSON.parse(evalJson[0]);
            passed = evalResult.passed;
            evaluationNotes = evalResult.notes || '';
          }
        } catch {
          evaluationNotes = parseError 
            ? 'Could not parse AI response as JSON' 
            : 'Evaluation parsing failed';
        }

        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          input: testCase.input_data,
          expectedOutput: testCase.expected_output,
          actualOutput,
          passed,
          evaluationNotes,
          executionTimeMs: executionTime,
          errorMessage: null,
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          input: testCase.input_data,
          expectedOutput: testCase.expected_output,
          actualOutput: null,
          passed: false,
          evaluationNotes: '',
          executionTimeMs: executionTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Summary
    const passedCount = results.filter(r => r.passed === true).length;
    const failedCount = results.filter(r => r.passed === false).length;
    const unknownCount = results.filter(r => r.passed === null).length;

    return new Response(
      JSON.stringify({
        success: true,
        templateName,
        summary: {
          total: results.length,
          passed: passedCount,
          failed: failedCount,
          unknown: unknownCount,
        },
        results,
        provider: aiConfig.provider,
        model: aiConfig.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Test prompt error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

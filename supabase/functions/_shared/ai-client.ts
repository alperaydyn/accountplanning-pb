// Shared AI client for all edge functions
// Supports: Lovable AI Gateway, OpenAI, OpenRouter, Local (OpenAI-compatible)

export interface AIProviderConfig {
  provider: 'lovable' | 'openai' | 'openrouter' | 'local';
  model: string | null;
  apiKey: string | null;
  baseUrl: string | null;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  messages: ChatMessage[];
  tools?: any[];
  tool_choice?: any;
  stream?: boolean;
  max_tokens?: number;
}

export interface AIResponse {
  choices: Array<{
    message: {
      content?: string;
      tool_calls?: Array<{
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

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

export async function callAI(
  config: AIProviderConfig,
  options: AIRequestOptions
): Promise<AIResponse> {
  const { provider, model, apiKey, baseUrl } = config;
  
  // Determine API key
  let resolvedApiKey: string;
  if (provider === 'lovable') {
    resolvedApiKey = Deno.env.get('LOVABLE_API_KEY') || '';
  } else if (apiKey) {
    resolvedApiKey = apiKey;
  } else {
    // Fallback to environment variables
    const envKeyMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      local: '', // Local doesn't need API key typically
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
  
  // OpenRouter specific headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://lovable.dev';
    headers['X-Title'] = 'Account Planning App';
  }
  
  // Build request body
  const body: any = {
    model: resolvedModel,
    messages: options.messages,
  };
  
  if (options.tools) {
    body.tools = options.tools;
  }
  
  if (options.tool_choice) {
    body.tool_choice = options.tool_choice;
  }
  
  if (options.stream !== undefined) {
    body.stream = options.stream;
  }
  
  if (options.max_tokens) {
    // Use max_completion_tokens for newer OpenAI models
    if (provider === 'openai' && resolvedModel.includes('gpt-4')) {
      body.max_completion_tokens = options.max_tokens;
    } else {
      body.max_tokens = options.max_tokens;
    }
  }
  
  console.log(`Calling AI provider: ${provider}, model: ${resolvedModel}, endpoint: ${endpoint}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI provider error (${provider}):`, response.status, errorText);
    
    if (response.status === 429) {
      throw new AIError('Rate limit exceeded. Please try again later.', 429);
    }
    if (response.status === 402) {
      throw new AIError('Payment required. Please add funds to your account.', 402);
    }
    if (response.status === 401) {
      throw new AIError('Invalid API key. Please check your credentials.', 401);
    }
    
    throw new AIError(`AI provider error: ${response.status} - ${errorText}`, response.status);
  }
  
  return response.json();
}

export class AIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AIError';
    this.status = status;
  }
}

// Test connection to AI provider
export async function testAIConnection(
  config: AIProviderConfig
): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const response = await callAI(config, {
      messages: [
        { role: 'user', content: 'Say "OK" if you can hear me.' }
      ],
      max_tokens: 10,
    });
    
    const content = response.choices?.[0]?.message?.content || '';
    return {
      success: true,
      message: `Connection successful: ${content.substring(0, 50)}`,
      model: config.model || DEFAULT_MODELS[config.provider],
    };
  } catch (error) {
    if (error instanceof AIError) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

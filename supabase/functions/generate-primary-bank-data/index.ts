import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomerInput {
  customerId: string;
  customerName: string;
  segment: string;
  sector: string;
  hasKrediAccount: boolean;
  loanProducts: string[];
  hasPosProduct: boolean;
  hasChequeProduct: boolean;
  hasCollateralProduct: boolean;
}

interface LoanSummary {
  bank_code: string;
  our_bank_flag: boolean;
  cash_loan: number;
  non_cash_loan: number;
  last_approval_date: string | null;
}

interface LoanDetail {
  bank_code: string;
  account_id: string;
  our_bank_flag: boolean;
  loan_type: string;
  loan_status: string;
  open_date: string;
  open_amount: number;
  current_amount: number;
}

interface PosData {
  total_pos_volume: number;
  our_bank_pos_volume: number;
  number_of_banks: number;
  pos_share: number;
}

interface ChequeData {
  cheque_volume_1m: number;
  cheque_volume_3m: number;
  cheque_volume_12m: number;
}

interface CollateralData {
  bank_code: string;
  our_bank_flag: boolean;
  group1_amount: number;
  group2_amount: number;
  group3_amount: number;
  group4_amount: number;
}

interface GeneratedData {
  loan_summary: LoanSummary[];
  loan_detail: LoanDetail[];
  pos_data: PosData | null;
  cheque_data: ChequeData | null;
  collateral_data: CollateralData[];
}

// Default models per provider
const DEFAULT_MODELS: Record<string, string> = {
  lovable: "google/gemini-3-flash-preview",
  openai: "gpt-4o-mini",
  openrouter: "anthropic/claude-3.5-sonnet",
  local: "llama3",
};

// API endpoints per provider
const ENDPOINTS: Record<string, string> = {
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer, recordMonth } = await req.json() as { customer: CustomerInput; recordMonth: string };

    // Get the authorization header for user identification
    const authHeader = req.headers.get("Authorization");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    // Get user from auth header
    let aiProvider = "lovable";
    let aiModel: string | null = null;
    let aiApiKey: string | null = null;
    let aiBaseUrl: string | null = null;

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch user's AI settings
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("ai_provider, ai_model, ai_api_key_encrypted, ai_base_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userSettings) {
          aiProvider = userSettings.ai_provider || "lovable";
          aiModel = userSettings.ai_model;
          aiApiKey = userSettings.ai_api_key_encrypted;
          aiBaseUrl = userSettings.ai_base_url;
        }
      }
    }

    // Determine API key based on provider
    let resolvedApiKey: string;
    if (aiProvider === "lovable") {
      resolvedApiKey = Deno.env.get("LOVABLE_API_KEY") || "";
    } else if (aiApiKey) {
      resolvedApiKey = aiApiKey;
    } else {
      const envKeyMap: Record<string, string> = {
        openai: "OPENAI_API_KEY",
        openrouter: "OPENROUTER_API_KEY",
        local: "",
      };
      resolvedApiKey = Deno.env.get(envKeyMap[aiProvider] || "") || "";
    }

    if (!resolvedApiKey && aiProvider !== "local") {
      throw new Error(`API key not configured for provider: ${aiProvider}`);
    }

    // Determine endpoint
    let endpoint: string;
    if (aiProvider === "local") {
      if (!aiBaseUrl) {
        throw new Error("Local provider requires a base URL");
      }
      endpoint = aiBaseUrl.endsWith("/v1/chat/completions")
        ? aiBaseUrl
        : `${aiBaseUrl.replace(/\/$/, "")}/v1/chat/completions`;
    } else {
      endpoint = ENDPOINTS[aiProvider] || ENDPOINTS.lovable;
    }

    // Determine model
    const resolvedModel = aiModel || DEFAULT_MODELS[aiProvider] || DEFAULT_MODELS.lovable;

    console.log(`Using AI provider: ${aiProvider}, model: ${resolvedModel}`);

    const systemPrompt = `You are a Turkish banking data generator. Generate realistic primary bank data for corporate banking customers.

CRITICAL RULES FOR CASH LOANS:
1. If "Has Kredi Account" is true, the customer MUST have cash loans (cash_loan > 0) from at least one bank
2. Our bank (code "A") is MANDATORY and should ALWAYS have cash_loan > 0 when customer has Kredi account
3. Other banks may or may not have cash loans - vary it realistically

LOAN AMOUNT RULES (based on segment):
- MİKRO: 50K - 500K TL per bank
- Kİ (Küçük İşletme): 200K - 2M TL per bank  
- OBİ: 1M - 20M TL per bank
- TİCARİ: 5M - 100M TL per bank

NON-CASH LOAN RULES:
- Non-cash loans (guarantees, letters of credit) are RARE - only 20-30% of customers have them
- Most banks should have non_cash_loan = 0
- When present, amounts are typically smaller than cash loans

APPROVAL DATE RULES:
- NOT all banks have last_approval_date - only 40-60% should have it
- Set last_approval_date to null for banks without recent approvals
- When present, dates should be within last 2 years

GENERAL RULES:
1. Each customer works with 1-5 banks (bank codes A-Z, our bank is always "A")
2. Loan types: "Nakit Kredi", "Rotatif", "Spot", "İhracat Kredisi", "İthalat Kredisi", "Yatırım Kredisi"
3. Loan statuses: "Aktif", "Kapalı", "Takipte"
4. Collateral groups: Group1=Cash/Deposit, Group2=Real Estate, Group3=Receivables, Group4=Other
5. Our bank (code "A") should have 20-60% market share
6. Generate realistic variety - not all banks should have same values`;

    const userPrompt = `Generate primary bank data for this customer:
- Name: ${customer.customerName}
- Segment: ${customer.segment}
- Sector: ${customer.sector}
- Has Kredi Account: ${customer.hasKrediAccount}
- Loan Products: ${customer.loanProducts.join(", ") || "None"}
- Has POS Product: ${customer.hasPosProduct}
- Has Cheque Product: ${customer.hasChequeProduct}
- Has Collateral Product: ${customer.hasCollateralProduct}

Generate appropriate banking data based on the customer profile.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_primary_bank_data",
          description: "Generate primary bank data for a customer",
          parameters: {
            type: "object",
            properties: {
              loan_summary: {
                type: "array",
                description: "List of banks the customer works with for loans",
                items: {
                  type: "object",
                  properties: {
                    bank_code: { type: "string", description: "Single letter A-Z" },
                    our_bank_flag: { type: "boolean" },
                    cash_loan: { type: "number" },
                    non_cash_loan: { type: "number" },
                    last_approval_date: { type: "string", description: "YYYY-MM-DD or null" }
                  },
                  required: ["bank_code", "our_bank_flag", "cash_loan", "non_cash_loan"]
                }
              },
              loan_detail: {
                type: "array",
                description: "Detailed loan accounts (only if hasKrediAccount is true)",
                items: {
                  type: "object",
                  properties: {
                    bank_code: { type: "string" },
                    account_id: { type: "string" },
                    our_bank_flag: { type: "boolean" },
                    loan_type: { type: "string" },
                    loan_status: { type: "string" },
                    open_date: { type: "string", description: "YYYY-MM-DD" },
                    open_amount: { type: "number" },
                    current_amount: { type: "number" }
                  },
                  required: ["bank_code", "account_id", "our_bank_flag", "loan_type", "loan_status", "open_date", "open_amount", "current_amount"]
                }
              },
              pos_data: {
                type: "object",
                description: "POS data if customer has POS product",
                properties: {
                  total_pos_volume: { type: "number" },
                  our_bank_pos_volume: { type: "number" },
                  number_of_banks: { type: "integer" },
                  pos_share: { type: "number", description: "Percentage 0-100" }
                },
                required: ["total_pos_volume", "our_bank_pos_volume", "number_of_banks", "pos_share"]
              },
              cheque_data: {
                type: "object",
                description: "Cheque data if customer has cheque product",
                properties: {
                  cheque_volume_1m: { type: "number" },
                  cheque_volume_3m: { type: "number" },
                  cheque_volume_12m: { type: "number" }
                },
                required: ["cheque_volume_1m", "cheque_volume_3m", "cheque_volume_12m"]
              },
              collateral_data: {
                type: "array",
                description: "Collateral data per bank if customer has collateral product",
                items: {
                  type: "object",
                  properties: {
                    bank_code: { type: "string" },
                    our_bank_flag: { type: "boolean" },
                    group1_amount: { type: "number" },
                    group2_amount: { type: "number" },
                    group3_amount: { type: "number" },
                    group4_amount: { type: "number" }
                  },
                  required: ["bank_code", "our_bank_flag", "group1_amount", "group2_amount", "group3_amount", "group4_amount"]
                }
              }
            },
            required: ["loan_summary"]
          }
        }
      }
    ];

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (resolvedApiKey) {
      headers["Authorization"] = `Bearer ${resolvedApiKey}`;
    }

    // OpenRouter specific headers
    if (aiProvider === "openrouter") {
      headers["HTTP-Referer"] = "https://lovable.dev";
      headers["X-Title"] = "Account Planning App";
    }

    // Build request body
    const body: Record<string, unknown> = {
      model: resolvedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools,
      tool_choice: { type: "function", function: { name: "generate_primary_bank_data" } }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "generate_primary_bank_data") {
      throw new Error("Invalid AI response structure");
    }

    const generatedData: GeneratedData = JSON.parse(toolCall.function.arguments);

    // Ensure our bank (A) is always included and properly flagged
    const ourBankIdx = generatedData.loan_summary.findIndex((ls) => ls.bank_code === "A");
    if (ourBankIdx === -1) {
      generatedData.loan_summary.unshift({
        bank_code: "A",
        our_bank_flag: true,
        cash_loan: 0,
        non_cash_loan: 0,
        last_approval_date: null,
      });
    } else {
      generatedData.loan_summary[ourBankIdx].our_bank_flag = true;
    }

    // Deterministic safety net (model sometimes returns 0):
    // If customer has Kredi, force cash_loan > 0 for our bank and at least one bank.
    if (customer.hasKrediAccount) {
      const range = (() => {
        switch (customer.segment) {
          case "MİKRO":
            return { min: 50_000, max: 500_000 };
          case "Kİ":
            return { min: 200_000, max: 2_000_000 };
          case "OBİ":
            return { min: 1_000_000, max: 20_000_000 };
          case "TİCARİ":
            return { min: 5_000_000, max: 100_000_000 };
          default:
            return { min: 200_000, max: 5_000_000 };
        }
      })();

      const randRounded = (min: number, max: number) =>
        Math.round((min + Math.random() * (max - min)) / 10_000) * 10_000;

      const anyCash = generatedData.loan_summary.some((ls) => (ls.cash_loan ?? 0) > 0);
      const our = generatedData.loan_summary.find((ls) => ls.bank_code === "A");
      if (our && (!anyCash || (our.cash_loan ?? 0) <= 0)) {
        our.cash_loan = randRounded(range.min, range.max);
      }
    }

    // Add record_month and customer_id to all records
    const result = {
      loan_summary: generatedData.loan_summary.map(ls => ({
        ...ls,
        record_month: recordMonth,
        customer_id: customer.customerId
      })),
      loan_detail: (generatedData.loan_detail || []).map(ld => ({
        ...ld,
        record_month: recordMonth,
        customer_id: customer.customerId
      })),
      pos_data: generatedData.pos_data ? {
        ...generatedData.pos_data,
        record_month: recordMonth,
        customer_id: customer.customerId
      } : null,
      cheque_data: generatedData.cheque_data ? {
        ...generatedData.cheque_data,
        record_month: recordMonth,
        customer_id: customer.customerId
      } : null,
      collateral_data: (generatedData.collateral_data || []).map(cd => ({
        ...cd,
        record_month: recordMonth,
        customer_id: customer.customerId
      })),
      provider: aiProvider,
      model: resolvedModel
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating primary bank data:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

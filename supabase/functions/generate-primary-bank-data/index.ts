import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customer, recordMonth } = await req.json() as { customer: CustomerInput; recordMonth: string };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a Turkish banking data generator. Generate realistic primary bank data for corporate banking customers.

RULES:
1. Each customer works with 1-5 banks (bank codes A-Z, our bank is always "A")
2. Loan amounts should be realistic based on segment:
   - Small: 100K - 5M TL
   - Medium: 1M - 50M TL
   - Large Enterprise: 10M - 500M TL
3. Non-cash loans are typically guarantees, letters of credit
4. Loan types: "Nakit Kredi", "Rotatif", "Spot", "İhracat Kredisi", "İthalat Kredisi", "Yatırım Kredisi"
5. Loan statuses: "Aktif", "Kapalı", "Takipte"
6. Collateral groups:
   - Group1: Cash/Deposit (en likit)
   - Group2: Real Estate/Machinery
   - Group3: Commercial Receivables
   - Group4: Other guarantees
7. Generate data that reflects the customer's segment and sector realistically
8. Our bank (code "A") should have reasonable market share (20-60%)
9. Dates should be within last 3 years`;

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_primary_bank_data" } }
      }),
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

    // Ensure our bank is always included
    const hasOurBank = generatedData.loan_summary.some(ls => ls.our_bank_flag);
    if (!hasOurBank && generatedData.loan_summary.length > 0) {
      generatedData.loan_summary[0].our_bank_flag = true;
      generatedData.loan_summary[0].bank_code = "A";
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
      }))
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

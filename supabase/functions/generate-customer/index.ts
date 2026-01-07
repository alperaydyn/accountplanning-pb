import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECTORS = ["Turizm", "Sağlık", "Enerji", "Perakende", "Ulaşım", "Gayrimenkul", "Tarım Hayvancılık"];
const SEGMENTS = ["TİCARİ", "OBİ", "Kİ", "MİKRO"];
const STATUSES = ["Yeni Müşteri", "Aktif", "Target", "Strong Target", "Ana Banka"];

const PRODUCTS = [
  { id: "adac72d8-5254-49ea-9f26-46b4997d1de3", name: "TL Vadesiz Mevduat", category: "TL Vadesiz" },
  { id: "20e0ad56-26f2-4bdd-8ea3-48554f400e28", name: "TL Vadeli Mevduat", category: "TL Vadeli" },
  { id: "160f319a-c906-4ac2-a63e-64ff947f1329", name: "YP Vadesiz Mevduat", category: "YP Vadesiz" },
  { id: "33b29561-6e94-4513-a0c3-dd07eb8ceb20", name: "YP Vadeli Mevduat", category: "YP Vadeli" },
  { id: "ac60430d-97e6-4648-a755-1299992ac0df", name: "TL Nakdi Kredi", category: "TL Nakdi Kredi" },
  { id: "711807bd-a17b-4480-981f-1fb2f000f6aa", name: "TL Gayrinakdi Kredi", category: "TL Gayrinakdi Kredi" },
  { id: "45d16c7e-45b7-470f-be2a-f4f5c628a0d9", name: "YP Nakdi Kredi", category: "YP Nakdi Kredi" },
  { id: "8bb25dae-95ce-4340-8842-8d5dc10bfad5", name: "YP Gayrinakdi Kredi", category: "YP Gayrinakdi Kredi" },
  { id: "f71d4d8d-2bd5-42bf-9eb2-679f4cde94ec", name: "Ticari Kart", category: "Ticari Kart" },
  { id: "3ed5a112-6389-4464-aa2c-4085813e22cf", name: "Üye İşyeri", category: "Üye İşyeri" },
  { id: "72ccc594-0230-4c68-9b81-081ed675d98b", name: "Maaş Ödemesi", category: "Maaş" },
  { id: "127345f8-cc88-4229-bca9-bf4a70adcfb2", name: "Hayat Sigortası", category: "Sigorta-Hayat" },
  { id: "e661f1cd-3ae0-4fff-b99b-808f7f5926dd", name: "Elementer Sigorta", category: "Sigorta-Elementer" },
  { id: "bffd3624-6984-4899-8b1d-048637f5149d", name: "BES", category: "Sigorta-BES" },
  { id: "4b483625-dec4-4f18-a946-854371d5957e", name: "Faktoring", category: "Faktoring" },
  { id: "abbfa480-063d-4d14-b80f-9f402350e6a3", name: "Leasing", category: "Leasing" },
  { id: "0fb515e2-140f-44ba-b306-93ed89e554fb", name: "Ödeme Çeki", category: "Ödeme Çeki" },
  { id: "34fe47ec-607c-41f8-81cc-8b35310b9b44", name: "Tahsil Çeki", category: "Tahsil Çeki" },
  { id: "de568fac-a3b6-4f66-a773-cc3533b3f18d", name: "DTS", category: "DTS" },
  { id: "9834d536-4c97-456f-94c8-ab3788a672d8", name: "TL Yatırım Fonu", category: "TL Yatırım Fonu" },
  { id: "e604d578-10f9-404e-97df-f6734f631497", name: "YP Yatırım Fonu", category: "YP Yatırım Fonu" },
];

// TL Vadesiz is mandatory for all customers
const MANDATORY_PRODUCT_ID = "adac72d8-5254-49ea-9f26-46b4997d1de3";

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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are a Turkish banking customer data generator. Generate realistic Turkish company names and data for a commercial banking CRM system.

Available sectors: ${SECTORS.join(", ")}
Available segments: ${SEGMENTS.join(", ")} (TİCARİ = largest, MİKRO = smallest)
Available statuses: ${STATUSES.join(", ")}

IMPORTANT - Status probability distribution (follow this strictly):
- Yeni Müşteri: 25% chance
- Aktif: 50% chance
- Target: 15% chance (rare)
- Strong Target: 10% chance
- Ana Banka: 5% chance (very rare)

Product count rules by status:
- Yeni Müşteri: 1 product (TL Vadesiz Mevduat mandatory)
- Aktif: 2-3 products
- Target: 4-5 products
- Strong Target: 6-7 products
- Ana Banka: 8-10 products

Volume estimation rules based on segment:
- TİCARİ: 10M - 500M TL range
- OBİ: 1M - 50M TL range
- Kİ: 100K - 5M TL range
- MİKRO: 10K - 500K TL range

Product volume patterns by sector:
- Enerji/Gayrimenkul: Higher credit volumes
- Turizm/Perakende: Higher cash management volumes
- Sağlık: Higher insurance volumes
- Tarım Hayvancılık: Higher leasing/factoring volumes
- Ulaşım: Higher fleet/leasing volumes`;

    const userPrompt = `Generate a new Turkish commercial banking customer with realistic data.

IMPORTANT:
- You MUST respond by calling the create_customer tool.
- Do NOT write any normal text.
- Keep values realistic and follow the rules exactly.

Rules recap:
- TL Vadesiz Mevduat (${MANDATORY_PRODUCT_ID}) is MANDATORY for all customers
- Product count must match the status rules
- Volumes should be realistic for the segment size

Available products (product_id -> name):
${PRODUCTS.map((p) => `${p.id} -> ${p.name}`).join("\n")}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Use a faster model for lower latency.
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_customer",
              description: "Create a new customer with products",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Company name" },
                  sector: { type: "string", enum: SECTORS },
                  segment: { type: "string", enum: SEGMENTS },
                  status: { type: "string", enum: STATUSES },
                  // DB expects an integer score.
                  principality_score: { type: "integer", minimum: 0, maximum: 100 },
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        // Restrict IDs so we never generate unknown products.
                        product_id: { type: "string", enum: PRODUCTS.map((p) => p.id) },
                        current_value: { type: "number" },
                      },
                      required: ["product_id", "current_value"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "sector", "segment", "status", "principality_score", "products"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_customer" } },
        // Keep this comfortably high to avoid rare "no tool call" failures.
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenAI response:", JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("Missing tool call in response:", JSON.stringify(data, null, 2));
      throw new Error("No valid response from AI");
    }

    const customerData = JSON.parse(toolCall.function.arguments);

    // Normalize types defensively (DB expects integer score).
    customerData.principality_score = Math.max(0, Math.min(100, Math.round(customerData.principality_score)));
    customerData.products = (customerData.products ?? []).map((p: { product_id: string; current_value: number }) => ({
      product_id: p.product_id,
      current_value: Number(p.current_value),
    }));
    // Ensure mandatory product is included
    const hasMandatory = customerData.products.some(
      (p: { product_id: string }) => p.product_id === MANDATORY_PRODUCT_ID,
    );
    if (!hasMandatory) {
      customerData.products.unshift({
        product_id: MANDATORY_PRODUCT_ID,
        current_value: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return new Response(JSON.stringify(customerData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating customer:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

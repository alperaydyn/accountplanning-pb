import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { callAI, type AIProviderConfig } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClickedElementInfo {
  selector: string;
  tagName: string;
  className: string;
  id?: string;
  textContent?: string;
  dataAttributes: Record<string, string>;
}

interface RAGChunk {
  id: string;
  chunk_id: string;
  category: string;
  audience: string[];
  title: string;
  business_description: string | null;
  technical_description: string | null;
  route: string | null;
  related_files: string[] | null;
  keywords: string[] | null;
  metadata: Record<string, unknown>;
}

// Maximum out-of-context attempts before blocking
const MAX_OUT_OF_CONTEXT = 3;
const BLOCK_DURATION_HOURS = 24;
const WINDOW_DURATION_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, clickedElement, currentRoute } = await req.json() as {
      question: string;
      clickedElement?: ClickedElementInfo;
      currentRoute?: string;
    };

    console.log(`RAG Query: "${question}", Route: ${currentRoute}, Element: ${clickedElement?.selector || 'none'}`);

    // Check if user is blocked
    const { data: limitData, error: limitError } = await supabase
      .from("rag_user_limits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (limitData?.blocked_until) {
      const blockedTime = new Date(limitData.blocked_until);
      if (blockedTime > new Date()) {
        return new Response(JSON.stringify({
          answer: "You have been temporarily blocked due to too many out-of-context queries. Please try again later.",
          blocked: true,
          blockedUntil: limitData.blocked_until,
          queryType: "out_of_context",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch all RAG chunks from database
    const { data: chunks, error: chunksError } = await supabase
      .from("rag_chunks")
      .select("*")
      .eq("is_active", true);

    if (chunksError) {
      console.error("Error fetching chunks:", chunksError);
    }

    // If no chunks in DB, load from static JSON file
    let ragContent = "";
    let availableChunks: RAGChunk[] = chunks || [];

    if (availableChunks.length === 0) {
      // Fall back to static documentation
      ragContent = `
The Account Planning System is a corporate banking portfolio management application.
Key features include:
- Dashboard with portfolio overview and AI insights
- Customer management with journey tracking
- Product performance tracking with HGO metrics
- Primary Bank analytics for share of wallet
- Actions agenda for planning and tracking
- AI Assistant for portfolio intelligence

For detailed documentation, please contact an administrator to load the RAG database.
      `;
    } else {
      // Format chunks as context
      ragContent = availableChunks.map(chunk => {
        let content = `## ${chunk.title} (${chunk.category})\n`;
        if (chunk.route) content += `Route: ${chunk.route}\n`;
        if (chunk.business_description) content += `Business: ${chunk.business_description}\n`;
        if (chunk.technical_description) content += `Technical: ${chunk.technical_description}\n`;
        if (chunk.keywords?.length) content += `Keywords: ${chunk.keywords.join(", ")}\n`;
        return content;
      }).join("\n---\n");
    }

    // Build context about clicked element
    let elementContext = "";
    if (clickedElement) {
      elementContext = `
The user clicked on a specific element:
- Tag: ${clickedElement.tagName}
- Selector: ${clickedElement.selector}
- ID: ${clickedElement.id || 'none'}
- Text content: ${clickedElement.textContent?.substring(0, 200) || 'none'}
- Data attributes: ${JSON.stringify(clickedElement.dataAttributes)}
`;
    }

    // Build route context
    let routeContext = "";
    if (currentRoute) {
      const routeChunk = availableChunks.find(c => c.route === currentRoute);
      if (routeChunk) {
        routeContext = `
Current page context:
- Route: ${currentRoute}
- Page: ${routeChunk.title}
- Description: ${routeChunk.business_description || routeChunk.technical_description}
`;
      }
    }

    // Step 1: Classify the query type
    const classificationPrompt = `
You are a query classifier for a banking application called "Account Planning System".

Classify the following user question into one of these categories:
1. "business" - Questions about business logic, KPIs, metrics, calculations, workflows
2. "technical" - Questions about code, implementation, file locations, components
3. "out_of_context" - Questions completely unrelated to the application (e.g., weather, jokes, personal questions)

Question: "${question}"
${elementContext}
${routeContext}

Respond with ONLY one word: business, technical, or out_of_context
`;

    const aiConfig: AIProviderConfig = {
      provider: 'lovable',
      model: 'google/gemini-3-flash-preview',
      apiKey: null,
      baseUrl: null,
    };

    const classificationResponse = await callAI(aiConfig, {
      messages: [{ role: 'user', content: classificationPrompt }],
      max_tokens: 10,
    });

    const queryType = classificationResponse.choices?.[0]?.message?.content?.trim().toLowerCase() || 'business';
    console.log(`Query classified as: ${queryType}`);

    // Handle out-of-context queries
    if (queryType === 'out_of_context') {
      // Update user limits
      const now = new Date();
      let newCount = 1;
      let blockedUntil: Date | null = null;

      if (limitData) {
        const windowStart = new Date(limitData.window_start);
        const windowEnd = new Date(windowStart.getTime() + WINDOW_DURATION_HOURS * 60 * 60 * 1000);

        if (now < windowEnd) {
          // Within window, increment count
          newCount = limitData.out_of_context_count + 1;
        } else {
          // Window expired, reset
          newCount = 1;
        }

        if (newCount >= MAX_OUT_OF_CONTEXT) {
          blockedUntil = new Date(now.getTime() + BLOCK_DURATION_HOURS * 60 * 60 * 1000);
        }

        await supabase
          .from("rag_user_limits")
          .update({
            out_of_context_count: newCount,
            window_start: newCount === 1 ? now.toISOString() : limitData.window_start,
            blocked_until: blockedUntil?.toISOString() || null,
          })
          .eq("user_id", user.id);
      } else {
        // Create new limit record
        await supabase
          .from("rag_user_limits")
          .insert({
            user_id: user.id,
            out_of_context_count: 1,
            window_start: now.toISOString(),
          });
      }

      const remainingRights = MAX_OUT_OF_CONTEXT - newCount;

      // Save feedback record for review
      const { data: feedback } = await supabase
        .from("rag_feedback")
        .insert({
          user_id: user.id,
          question,
          answer: "Out of context query - not answered",
          query_type: "out_of_context",
          needs_investigation: false,
        })
        .select()
        .single();

      if (blockedUntil) {
        return new Response(JSON.stringify({
          answer: "This question is outside the scope of the Account Planning System. You have exceeded the allowed out-of-context queries. Please try again in 24 hours.",
          blocked: true,
          blockedUntil: blockedUntil.toISOString(),
          queryType: "out_of_context",
          feedbackId: feedback?.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        answer: `I can only help with questions about the Account Planning System. This question appears to be outside my scope. Please ask about features, metrics, or how to use the application.\n\n⚠️ Warning: ${remainingRights} out-of-context ${remainingRights === 1 ? 'attempt' : 'attempts'} remaining before a 24-hour block.`,
        remainingRights,
        queryType: "out_of_context",
        feedbackId: feedback?.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Find relevant chunks using improved matching
    const questionLower = question.toLowerCase();
    const questionWords = questionLower
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => w.replace(/[^a-z0-9]/g, ''));

    // Score each chunk by relevance
    const scoredChunks = availableChunks.map(chunk => {
      const content = `${chunk.title} ${chunk.business_description || ''} ${chunk.technical_description || ''} ${chunk.keywords?.join(' ') || ''}`.toLowerCase();
      
      let score = 0;
      
      // Exact phrase match (highest priority)
      if (content.includes(questionLower)) score += 10;
      
      // Word matches
      for (const word of questionWords) {
        if (content.includes(word)) score += 2;
        if (chunk.title?.toLowerCase().includes(word)) score += 3;
        if (chunk.keywords?.some(k => k.toLowerCase().includes(word))) score += 4;
      }
      
      // Route match bonus
      if (currentRoute && chunk.route === currentRoute) score += 5;
      
      // Category match for query type
      if (queryType === 'technical' && chunk.category?.toLowerCase().includes('technical')) score += 2;
      if (queryType === 'business' && (chunk.category?.toLowerCase().includes('business') || chunk.category?.toLowerCase().includes('kpi'))) score += 2;
      
      return { chunk, score };
    });

    // Get top relevant chunks (minimum score of 2)
    const relevantChunks = scoredChunks
      .filter(sc => sc.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(sc => sc.chunk);

    console.log(`Found ${relevantChunks.length} relevant chunks for question`);

    // Build focused context from relevant chunks only
    let focusedContext = "";
    let rawSources: { title: string; category: string; content: string }[] = [];

    if (relevantChunks.length > 0) {
      focusedContext = relevantChunks.map(chunk => {
        let content = `## ${chunk.title} (${chunk.category})\n`;
        if (chunk.route) content += `Route: ${chunk.route}\n`;
        if (chunk.business_description) content += `Business: ${chunk.business_description}\n`;
        if (chunk.technical_description) content += `Technical: ${chunk.technical_description}\n`;
        return content;
      }).join("\n---\n");

      // Prepare raw sources for citation
      rawSources = relevantChunks.map(chunk => ({
        title: chunk.title,
        category: chunk.category,
        content: chunk.business_description || chunk.technical_description || '',
      }));
    }

    // Step 3: For technical queries, fetch relevant source code if needed
    let codeContext = "";
    if (queryType === 'technical' && currentRoute) {
      const routeChunk = availableChunks.find(c => c.route === currentRoute);
      if (routeChunk?.related_files?.length) {
        codeContext = `\nRelated source files: ${routeChunk.related_files.join(', ')}`;
      }
    }

    // Step 4: Generate the answer - only if we have sufficient sources
    let answer: string;
    let needsInvestigation = false;
    const usedChunkIds = relevantChunks.map(c => c.chunk_id);

    if (relevantChunks.length === 0) {
      // No relevant sources found
      answer = "I couldn't find relevant information about this in the documentation. This question has been marked for review by administrators.";
      needsInvestigation = true;
    } else {
      const answerPrompt = `You are a helpful assistant for the "Account Planning System", a corporate banking application.

IMPORTANT: You MUST only answer based on the provided sources below. Do NOT make up or infer information not explicitly stated in these sources.

### SOURCES:
${focusedContext}

${elementContext}
${routeContext}
${codeContext}

### USER QUESTION:
"${question}"

### INSTRUCTIONS:
1. Answer ONLY using information from the provided sources
2. Keep the answer SHORT (2-4 sentences maximum)
3. If the sources don't contain the answer, respond with: "I don't have specific information about this in my documentation."
4. Do NOT add any information not present in the sources
5. Be direct and factual

### ANSWER:`;

      const answerResponse = await callAI(aiConfig, {
        messages: [{ role: 'user', content: answerPrompt }],
        max_tokens: 300,
      });

      answer = answerResponse.choices?.[0]?.message?.content || "I couldn't generate an answer. Please try rephrasing your question.";

      // Check if answer indicates missing information
      needsInvestigation = answer.toLowerCase().includes("don't have specific information") || 
                                 answer.toLowerCase().includes("marked for review") ||
                                 answer.toLowerCase().includes("not in my documentation");
    }

    // Append raw sources at the end
    if (rawSources.length > 0) {
      const sourcesList = rawSources.map((s, i) => 
        `**[${i + 1}] ${s.title}** (${s.category})\n${s.content.substring(0, 200)}${s.content.length > 200 ? '...' : ''}`
      ).join('\n\n');
      
      answer += `\n\n---\n📚 **Sources (${rawSources.length}):**\n\n${sourcesList}`;
    }

    // Save feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from("rag_feedback")
      .insert({
        user_id: user.id,
        question,
        answer,
        chunk_ids_used: usedChunkIds,
        query_type: queryType as 'business' | 'technical',
        needs_investigation: needsInvestigation,
      })
      .select()
      .single();

    if (feedbackError) {
      console.error("Error saving feedback:", feedbackError);
    }

    return new Response(JSON.stringify({
      answer,
      queryType,
      feedbackId: feedback?.id,
      chunksUsed: usedChunkIds.length,
      needsInvestigation,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("RAG Assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

// Helper function to get file descriptions for code context
function getFileDescription(filePath: string): string {
  const descriptions: Record<string, string> = {
    // Pages
    'src/pages/Dashboard.tsx': 'Main dashboard page with portfolio overview, summary cards, and daily plan',
    'src/pages/Index.tsx': 'Landing/index page that redirects to dashboard or auth',
    'src/pages/Customers.tsx': 'Customer list page with filtering and customer management',
    'src/pages/CustomerDetail.tsx': 'Individual customer detail view with products and actions',
    'src/pages/CustomerJourney.tsx': 'Customer journey tracking and visualization',
    'src/pages/ProductPerformance.tsx': 'Product performance metrics and HGO tracking',
    'src/pages/PrimaryBank.tsx': 'Primary bank analysis and share of wallet',
    'src/pages/PrimaryBankEngine.tsx': 'Primary bank engine for portfolio-level analysis',
    'src/pages/ActionsAgenda.tsx': 'Actions agenda with calendar and list views',
    'src/pages/AIAssistant.tsx': 'AI chat assistant for portfolio insights',
    'src/pages/Settings.tsx': 'Application settings including AI and prompt management',
    'src/pages/Preferences.tsx': 'User preferences for theme, language, notifications',
    'src/pages/Thresholds.tsx': 'Product threshold configuration by segment/sector',
    'src/pages/Auth.tsx': 'Authentication page for login and signup',
    
    // Hooks
    'src/hooks/useCustomers.ts': 'Hook for fetching and managing customer data from Supabase',
    'src/hooks/useActions.ts': 'Hook for fetching and managing actions from Supabase',
    'src/hooks/useProducts.ts': 'Hook for fetching product definitions',
    'src/hooks/useCustomerProducts.ts': 'Hook for fetching customer-product relationships',
    'src/hooks/usePortfolioSummary.ts': 'Hook for calculating portfolio summary metrics (benchmark score, customer counts)',
    'src/hooks/usePortfolioTargets.ts': 'Hook for fetching portfolio targets and HGO metrics',
    'src/hooks/usePrimaryBankData.ts': 'Hook for fetching primary bank data (loans, POS, collateral)',
    'src/hooks/useInsights.ts': 'Hook for fetching AI-generated portfolio insights',
    'src/hooks/useProductThresholds.ts': 'Hook for fetching and managing product thresholds',
    'src/hooks/useUserSettings.ts': 'Hook for user settings and preferences',
    'src/hooks/useAIChatSessions.ts': 'Hook for AI chat session management',
    
    // Components
    'src/components/dashboard/SummaryCards.tsx': 'Dashboard summary cards showing key metrics',
    'src/components/dashboard/InsightsPanel.tsx': 'AI insights panel on dashboard',
    'src/components/dashboard/DailyPlanPanel.tsx': 'Daily plan panel for scheduled actions',
    'src/components/dashboard/ProductPerformanceTable.tsx': 'Product performance table with HGO metrics',
    'src/components/actions/ActionPlanningModal.tsx': 'Modal for planning and updating actions',
    'src/components/actions/AddActionModal.tsx': 'Modal for creating new actions',
    'src/components/customer/PrimaryBankPanel.tsx': 'Panel showing primary bank data for a customer',
    'src/components/customer/AutoPilotPanel.tsx': 'Autopilot workflow panel for automated actions',
    'src/components/customer/PrincipalityScoreModal.tsx': 'Modal showing principality score breakdown',
    'src/components/customer/CreateCustomerModal.tsx': 'Modal for creating new customers',
    'src/components/settings/AIProviderSettings.tsx': 'AI provider configuration settings',
    'src/components/settings/PromptManagementPanel.tsx': 'Prompt template management for admins',
    'src/components/settings/RAGManagementPanel.tsx': 'RAG documentation management panel',
    
    // Data files
    'src/data/customers.ts': 'Customer data types and mock data',
    'src/data/actions.ts': 'Action data types and mock data',
    'src/data/products.ts': 'Product definitions and mock data',
    'src/data/portfolio.ts': 'Portfolio data types and mock data',
    'src/data/autopilot.ts': 'Autopilot workflow definitions',
    
    // Types and contexts
    'src/types/index.ts': 'TypeScript type definitions for the application',
    'src/contexts/AuthContext.tsx': 'Authentication context and provider',
    'src/contexts/LanguageContext.tsx': 'Multi-language support context',
    
    // Edge functions
    'supabase/functions/ai-action-assistant/index.ts': 'Edge function for AI action assistant',
    'supabase/functions/generate-insights/index.ts': 'Edge function for generating AI insights',
    'supabase/functions/generate-actions/index.ts': 'Edge function for generating action recommendations',
    'supabase/functions/rag-assistant/index.ts': 'Edge function for RAG-based help assistant',
  };
  
  return descriptions[filePath] || 'Source file for application functionality';
}

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

    // Use DB chunks when available; otherwise fall back to a small built-in overview.
    // (This prevents the assistant from returning "no relevant information" just because the DB hasn't been seeded yet.)
    let availableChunks: RAGChunk[] = chunks || [];

    if (availableChunks.length === 0) {
      availableChunks = [
        {
          id: "fallback_overview",
          chunk_id: "fallback_overview",
          category: "General",
          audience: ["business", "technical"],
          title: "Application Overview (Fallback)",
          business_description:
            "The Account Planning System is a corporate banking portfolio management app for relationship/portfolio managers. It includes a Dashboard portfolio overview, customer journey tracking, product performance (HGO/target achievement), primary bank analytics (share of wallet), an actions agenda for planning, and an AI assistant.",
          technical_description: null,
          route: "/",
          related_files: null,
          keywords: [
            "account",
            "planning",
            "system",
            "dashboard",
            "customers",
            "actions",
            "primary",
            "bank",
            "hgo",
          ],
          metadata: { source: "fallback" },
        },
      ];
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
    const scoredChunks = availableChunks.map((chunk) => {
      const content = `${chunk.title} ${chunk.business_description || ""} ${chunk.technical_description || ""} ${chunk.keywords?.join(" ") || ""}`.toLowerCase();

      let score = 0;

      // Exact phrase match (highest priority)
      if (content.includes(questionLower)) score += 10;

      // Word matches
      for (const word of questionWords) {
        if (content.includes(word)) score += 2;
        if (chunk.title?.toLowerCase().includes(word)) score += 3;
        if (chunk.keywords?.some((k) => k.toLowerCase().includes(word))) score += 4;
      }

      // Route match bonus
      if (currentRoute && chunk.route === currentRoute) score += 5;

      // Category match for query type
      if (queryType === "technical" && chunk.category?.toLowerCase().includes("technical")) score += 2;
      if (queryType === "business" && (chunk.category?.toLowerCase().includes("business") || chunk.category?.toLowerCase().includes("kpi"))) score += 2;

      return { chunk, score };
    });

    const sortedScoredChunks = scoredChunks.sort((a, b) => b.score - a.score);

    // Get top relevant chunks (minimum score of 2)
    const relevantChunks = sortedScoredChunks
      .filter((sc) => sc.score >= 2)
      .slice(0, 5)
      .map((sc) => sc.chunk);

    const topScore = sortedScoredChunks[0]?.score ?? 0;
    const hasSufficientSources = relevantChunks.length > 0 && topScore >= 4;

    console.log(
      `Found ${relevantChunks.length} relevant chunks for question (topScore=${topScore})`,
    );

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

    // Step 3: Collect related source files for code context
    let relatedFiles: string[] = [];
    
    // Get related files from matched chunks
    for (const chunk of relevantChunks) {
      if (chunk.related_files?.length) {
        relatedFiles.push(...chunk.related_files);
      }
    }
    
    // Also get files from current route chunk
    if (currentRoute) {
      const routeChunk = availableChunks.find(c => c.route === currentRoute);
      if (routeChunk?.related_files?.length) {
        relatedFiles.push(...routeChunk.related_files);
      }
    }
    
    // Deduplicate files
    relatedFiles = [...new Set(relatedFiles)];

    // Step 4: Build code context - dynamic source code reading
    let codeContext = "";
    let dynamicCodeAnalysis = "";
    
    // If we have few/no chunks OR this is a technical query, do dynamic code analysis
    const needsDynamicAnalysis = relevantChunks.length < 2 || queryType === 'technical';
    
    if (needsDynamicAnalysis) {
      // Build a mapping of routes to likely source files
      const routeToFiles: Record<string, string[]> = {
        '/': ['src/pages/Index.tsx', 'src/pages/Dashboard.tsx', 'src/components/dashboard/SummaryCards.tsx', 'src/components/dashboard/InsightsPanel.tsx'],
        '/dashboard': ['src/pages/Dashboard.tsx', 'src/components/dashboard/SummaryCards.tsx', 'src/components/dashboard/InsightsPanel.tsx', 'src/components/dashboard/DailyPlanPanel.tsx', 'src/hooks/usePortfolioSummary.ts'],
        '/product-performance': ['src/pages/ProductPerformance.tsx', 'src/components/dashboard/ProductPerformanceTable.tsx', 'src/hooks/usePortfolioTargets.ts'],
        '/customer-journey': ['src/pages/CustomerJourney.tsx', 'src/hooks/useCustomers.ts', 'src/hooks/useActions.ts'],
        '/primary-bank': ['src/pages/PrimaryBank.tsx', 'src/hooks/usePrimaryBankData.ts', 'src/components/customer/PrimaryBankPanel.tsx'],
        '/primary-bank-engine': ['src/pages/PrimaryBankEngine.tsx', 'src/hooks/usePrimaryBankData.ts'],
        '/customers': ['src/pages/Customers.tsx', 'src/hooks/useCustomers.ts', 'src/components/customer/CreateCustomerModal.tsx'],
        '/actions': ['src/pages/ActionsAgenda.tsx', 'src/hooks/useActions.ts', 'src/components/actions/ActionPlanningModal.tsx', 'src/components/actions/AddActionModal.tsx'],
        '/ai-assistant': ['src/pages/AIAssistant.tsx', 'src/hooks/useAIChatSessions.ts'],
        '/settings': ['src/pages/Settings.tsx', 'src/components/settings/AIProviderSettings.tsx', 'src/components/settings/PromptManagementPanel.tsx', 'src/components/settings/RAGManagementPanel.tsx'],
        '/preferences': ['src/pages/Preferences.tsx', 'src/hooks/useUserSettings.ts'],
        '/thresholds': ['src/pages/Thresholds.tsx', 'src/hooks/useProductThresholds.ts'],
      };
      
      // Get files for current route
      const routeFiles = currentRoute ? (routeToFiles[currentRoute] || []) : [];
      
      // Add route-specific files if not already included
      for (const file of routeFiles) {
        if (!relatedFiles.includes(file)) {
          relatedFiles.push(file);
        }
      }
      
      // Add common hook files based on question keywords
      const keywordToFiles: Record<string, string[]> = {
        'customer': ['src/hooks/useCustomers.ts', 'src/data/customers.ts', 'src/types/index.ts'],
        'action': ['src/hooks/useActions.ts', 'src/data/actions.ts', 'src/components/actions/ActionPlanningModal.tsx'],
        'product': ['src/hooks/useProducts.ts', 'src/data/products.ts', 'src/hooks/useCustomerProducts.ts'],
        'portfolio': ['src/hooks/usePortfolioSummary.ts', 'src/hooks/usePortfolioTargets.ts', 'src/data/portfolio.ts'],
        'primary bank': ['src/hooks/usePrimaryBankData.ts', 'src/components/customer/PrimaryBankPanel.tsx'],
        'principality': ['src/components/customer/PrincipalityScoreModal.tsx', 'src/hooks/useCustomers.ts'],
        'insight': ['src/hooks/useInsights.ts', 'src/components/dashboard/InsightsPanel.tsx'],
        'autopilot': ['src/components/customer/AutoPilotPanel.tsx', 'src/data/autopilot.ts'],
        'threshold': ['src/hooks/useProductThresholds.ts', 'src/pages/Thresholds.tsx'],
        'benchmark': ['src/hooks/usePortfolioSummary.ts', 'src/components/dashboard/SummaryCards.tsx'],
        'hgo': ['src/hooks/usePortfolioTargets.ts', 'src/components/dashboard/ProductPerformanceTable.tsx'],
        'target': ['src/hooks/usePortfolioTargets.ts', 'src/pages/ProductPerformance.tsx'],
        'dashboard': ['src/pages/Dashboard.tsx', 'src/components/dashboard/SummaryCards.tsx'],
        'ai': ['src/pages/AIAssistant.tsx', 'supabase/functions/ai-action-assistant/index.ts'],
        'auth': ['src/contexts/AuthContext.tsx', 'src/pages/Auth.tsx', 'src/components/ProtectedRoute.tsx'],
        'setting': ['src/pages/Settings.tsx', 'src/hooks/useUserSettings.ts'],
      };
      
      for (const [keyword, files] of Object.entries(keywordToFiles)) {
        if (questionLower.includes(keyword)) {
          for (const file of files) {
            if (!relatedFiles.includes(file)) {
              relatedFiles.push(file);
            }
          }
        }
      }
      
      // Limit to top 8 most relevant files
      relatedFiles = relatedFiles.slice(0, 8);
      
      if (relatedFiles.length > 0) {
        codeContext = `\n\n### Related Source Files:\nThe following source files are related to this query and can be used to understand the implementation:\n${relatedFiles.map(f => `- ${f}`).join('\n')}`;
        
        // Generate a code analysis description for the AI
        dynamicCodeAnalysis = `
### Dynamic Code Analysis:
Based on the user's question and the current page (${currentRoute || 'unknown'}), here are the relevant implementation details:

**Architecture Overview:**
- This is a React + TypeScript application using Vite, Tailwind CSS, and shadcn/ui components
- State management uses React Query (@tanstack/react-query) for server state
- Backend is powered by Supabase (PostgreSQL database, Edge Functions, Auth)
- Data is fetched through custom hooks in src/hooks/

**Key Technical Patterns:**
1. **Data Hooks**: All data fetching is done through custom hooks (e.g., useCustomers, useActions, useProducts)
2. **Supabase Integration**: Database queries use the Supabase client from src/integrations/supabase/client.ts
3. **Type Safety**: Types are defined in src/types/index.ts and auto-generated from Supabase in src/integrations/supabase/types.ts
4. **Edge Functions**: AI and complex operations use Supabase Edge Functions in supabase/functions/

**Relevant Files for this Query:**
${relatedFiles.map(f => `- **${f}**: ${getFileDescription(f)}`).join('\n')}
`;
      }
    }

    // Step 5: Generate the answer
    let answer: string;
    let needsInvestigation = false;
    const usedChunkIds = relevantChunks.map(c => c.chunk_id);

    // Build the answer prompt - include dynamic code analysis when chunks are insufficient
    const hasGoodDocumentation = relevantChunks.length >= 2 && topScore >= 4;
    
    const answerPrompt = `You are a helpful assistant for the "Account Planning System", a corporate banking application.

${hasGoodDocumentation ? 'IMPORTANT: Answer based on the provided documentation sources.' : 'IMPORTANT: Documentation is limited for this query. Use the provided code context and your understanding of the application architecture to provide a helpful answer.'}

### DOCUMENTATION SOURCES:
${focusedContext || 'No specific documentation chunks found.'}

${dynamicCodeAnalysis}
${codeContext}

${elementContext}
${routeContext}

### USER QUESTION:
"${question}"

### QUERY TYPE: ${queryType} (${queryType === 'business' ? 'user wants business/functional explanation' : 'user wants technical/implementation details'})

### INSTRUCTIONS:
1. ${hasGoodDocumentation ? 'Answer primarily using the documentation sources' : 'Use the code context and architecture information to provide a helpful answer'}
2. For BUSINESS queries: Focus on what the feature does, how it helps users, and business value
3. For TECHNICAL queries: Focus on implementation details, file locations, code patterns, and how things work technically
4. Keep the answer concise (3-5 sentences for business, can be longer for technical)
5. If you truly cannot find relevant information, say so honestly
6. Be direct and helpful

### ANSWER:`;

    const answerResponse = await callAI(aiConfig, {
      messages: [{ role: 'user', content: answerPrompt }],
      max_tokens: 500,
    });

    answer = answerResponse.choices?.[0]?.message?.content || "I couldn't generate an answer. Please try rephrasing your question.";

    // Check if answer indicates missing information
    needsInvestigation = !hasGoodDocumentation && relevantChunks.length === 0;

    // Append raw sources at the end
    if (rawSources.length > 0) {
      const sourcesList = rawSources
        .map(
          (s, i) => `**[${i + 1}] ${s.title}** (${s.category})\n\n${s.content}`,
        )
        .join("\n\n---\n\n");

      answer += `\n\n---\nSources (raw):\n\n${sourcesList}`;
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

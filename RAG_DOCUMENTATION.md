# Account Planning System - RAG Documentation

> Comprehensive documentation for the Account Planning System, structured for RAG (Retrieval-Augmented Generation) systems to answer both business and technical questions.

---

## Application Overview

**Application Name:** Account Planning System
**Domain:** Corporate Banking - Portfolio Management
**Version:** 2.0
**Technology Stack:** React 18 + TypeScript + Vite + Supabase + TailwindCSS

### What is this application?

The Account Planning System is a corporate banking relationship management application designed for portfolio managers to optimize customer relationships and maximize revenue opportunities. It provides data-driven insights, AI-powered action recommendations, and streamlined customer engagement workflows.

### Key Capabilities

1. **Portfolio Management** - Track and manage corporate banking customer portfolios
2. **AI-Powered Insights** - Automated recommendations for customer actions and daily planning
3. **Primary Bank Analytics** - Share of wallet analysis and competitive intelligence
4. **Product Performance Tracking** - Stock/flow metrics with target achievement monitoring
5. **Customer Journey Visualization** - Progressive relationship development roadmap
6. **Multi-language Support** - Turkish, English, and Spanish interfaces

### Target Users

- **Portfolio Manager (Relationship Manager)** - Primary user managing corporate customer portfolios
- **Administrator** - System configuration and user management

---

## Pages and Features

### Dashboard (/)

**Business Purpose:** The main landing page providing a portfolio overview with personalized greeting, key summary metrics, daily action planning calendar, and AI-generated insights for portfolio optimization.

**Key Features:**

1. **Personalized Header**
   - Time-based greeting (Good morning/afternoon/evening) with user's first name from portfolio_managers table
   - Decorative gradient background with glassmorphism effects
   - Staggered entrance animations for visual polish

2. **Historical Date Selector**
   - Current month with "(Current)" label
   - Last 3 months (rolling)
   - Last 4 completed quarter end months (Q1=March, Q2=June, Q3=September, Q4=December)
   - Last 2 year ends (December)
   - All data components sync with selected date

3. **Summary Cards (5-column grid)**
   - **Benchmark Score**: Count of HGO% >= 75% across all portfolio_targets metrics (stock_count, stock_volume, flow_count, flow_volume)
   - **Customer Journey**: Customer distribution showing Aktif → Target → Strong Target → Ana Banka progression
   - **Primary Bank Score**: Percentage of customers with status 'Ana Banka' over total customers
   - **Customer Experience**: Overall experience score from customer_experience_metrics with X/6 key moments on track
   - **Actions**: Count of planned actions with completed count subtitle
   - Each card is clickable and navigates to the relevant detailed page

4. **Daily Plan Panel (3-column layout)**
   - **Monthly Pending Actions**: Paginated list (4 per page) of pending/planned actions for the selected month
   - **Day's Actions**: Actions for the selected day with inline date dropdown selector
   - **Action Calendar (Mini Calendar)**:
     - Blue intensity gradient (darker = more completed actions) for visualizing daily performance
     - Amber background for days with only pending actions
     - Circular badge on top-right corner showing planned action count
     - Hover tooltip showing completed/total ratio
     - Legend explaining: Completed (blue), Pending (amber), Planned (badge)
     - Monthly stats: completed this month and active days count

5. **AI Insights Panel (2-column layout)**
   - **Product Performance Insights**: AI-generated analysis of portfolio product metrics
     - Three insight types: critical (red), warning (yellow), info (blue)
     - Click to expand details with affected products and recommendations
     - Navigate to filtered customer list from product links
   - **Action Quality Insights**: AI analysis of action portfolio quality
     - Four categories: Sufficiency, Alignment, Balance, Quality
     - Category badges with icons for quick identification
     - Click to expand with metrics and suggestions
   - **Version Management**: View historical insight versions, switch between versions
   - **Feedback System**: Like/dislike buttons with persistence
   - **Refresh**: Regenerate insights with AI

**Data Sources:** portfolio_managers, customers, actions, portfolio_targets, ai_insights, ai_action_insights, customer_experience_metrics

**Technical Files:** `src/pages/Dashboard.tsx`, `src/components/dashboard/SummaryCards.tsx`, `src/components/dashboard/DailyPlanPanel.tsx`, `src/components/dashboard/InsightsPanel.tsx`

---

### Help Inspector Panel (Global Feature)

**Business Purpose:** An interactive help system accessible from any page in the application. Allows users to get contextual help about the application by either selecting a specific UI element or asking questions directly. Uses AI-powered RAG (Retrieval-Augmented Generation) to provide accurate, source-cited answers.

**Activation Methods:**

1. **Header Help Button** - Click the HelpCircle icon in the application header to open a dropdown menu
2. **Three Actions Available:**
   - **Inspect Element** (MousePointer2 icon): Enter inspection mode to click on any UI element
   - **Ask a Question** (MessageCircleQuestion icon): Open the chat sidebar directly without element selection
   - **Start Tour** (Play icon): Launch the guided dashboard tour

**Key Features:**

1. **Inspection Mode**
   - Crosshair cursor indicates active inspection mode
   - Hover over any element to see a highlight box with primary color border
   - Tooltip shows "Click to ask about this element"
   - Clicking an element captures its metadata: tag name, CSS selector, ID, text content, data attributes, and position
   - Press Escape to exit inspection mode without selecting

2. **Element Context Capture**
   - Selected element info displayed in sidebar header with tag name badge and ID badge (if present)
   - Text content preview (first 100 characters) shown below
   - Element context is sent to the AI for contextual answers

3. **Chat Sidebar (InspectorSidebar)**
   - Fixed-width (w-96 = 384px) right-side panel with full height
   - Header shows "Help Inspector" title with close button
   - Example prompts displayed when no messages: "What does this show?", "How is this calculated?"
   - User messages styled with primary background (right-aligned)
   - Assistant messages styled with muted background (left-aligned)
   - Auto-scroll to bottom on new messages
   - Auto-focus on input when sidebar opens
   - Messages cleared when sidebar closes

4. **Rate Limiting & Abuse Prevention**
   - Query classification: business, technical, or out_of_context
   - Out-of-context queries tracked per user (3 attempts per 24h window)
   - Warning shown when remaining attempts <= 2
   - 24-hour block applied after 3 out-of-context queries
   - Blocked state shown with AlertTriangle icon and unblock timestamp

5. **Feedback System**
   - ThumbsUp/ThumbsDown buttons appear below each assistant message
   - Feedback saved to rag_feedback table
   - Toast confirmation on feedback submission
   - Buttons disabled after feedback submitted
   - Query type badge shown for non-standard queries (out_of_scope, needs_review)

6. **AI Response Generation (rag-assistant Edge Function)**
   - **Query Classification**: First pass classifies query as business/technical/out_of_context using Gemini
   - **Source Matching**: Scores rag_chunks by keyword matches, route relevance, and query type
   - **Dynamic Code Analysis**: Falls back to source file analysis when documentation is insufficient
   - **Context Building**: Combines clicked element info, current route, and matched chunks
   - **Answer Generation**: Produces concise answers (3-5 sentences for business, longer for technical)
   - **Source Citation**: Appends raw source excerpts at the end of answers
   - **Investigation Flagging**: Marks queries with no relevant sources for admin review

**Data Flow:**

```
User Action → InspectorOverlay (if inspecting) → InspectorContext state update
           → InspectorSidebar opens
           → useRAGChat.sendMessage(question)
           → rag-assistant Edge Function
                → Query classification (business/technical/out_of_context)
                → Chunk matching from rag_chunks table
                → Dynamic code context building (if needed)
                → AI answer generation
                → Feedback record creation in rag_feedback table
           → Response displayed with optional feedback buttons
```

**Database Tables:**

| Table | Purpose |
|-------|---------|
| rag_chunks | Documentation chunks indexed by route, keywords, and category |
| rag_feedback | Stores Q&A pairs with feedback scores and investigation flags |
| rag_user_limits | Tracks out-of-context query counts and block status per user |

**Technical Files:** `src/components/inspector/InspectorTrigger.tsx`, `src/components/inspector/InspectorOverlay.tsx`, `src/components/inspector/InspectorSidebar.tsx`, `src/contexts/InspectorContext.tsx`, `src/hooks/useRAGChat.ts`, `supabase/functions/rag-assistant/index.ts`

---

### Product Performance (/product-performance)

**Business Purpose:** Shows portfolio-level product metrics and target achievement analysis. Products are categorized by status (On Track, At Risk, Critical) with sub-statuses. Features an interactive hero panel for filtering and a detailed metrics table.

**Key Features:**

1. **Date Period Selector**
   - Current month with "(Current)" label
   - Last 3 months (rolling)
   - Last 4 completed quarter ends (Q1=March, Q2=June, Q3=September, Q4=December)
   - Last 2 year ends (December)
   - All metrics sync with selected date

2. **Hero Panel (4-column KPI grid)**
   - **Total Products**: Shows total count with primary accent, clicking clears all filters
   - **On Track (Yolunda)**: Emerald-themed button showing sum of on_track + growing + diversity products
   - **At Risk (Riskli)**: Amber-themed button showing sum of at_risk + melting + ticket_size products
   - **Critical (Kritik)**: Destructive-themed button showing critical product count
   - Gradient background with glassmorphism card styling
   - Active state highlighting with shadow and border emphasis

3. **Hierarchical Status Filtering System**
   - 3 base categories (On Track, At Risk, Critical) aggregate sub-statuses for KPI display
   - Clicking base status expands checkbox panel for sub-status selection
   - Sub-statuses auto-selected when base status clicked
   - Multiple sub-statuses can be toggled independently via checkboxes
   - Filter indicator badge shows active filters with clear button

4. **Sub-Status Definitions**
   - **On Track (on_track)**: Overall HGO average >= 80%
   - **Growing (growing)**: Flow metrics good but stock low - building momentum
   - **Diversity (diversity)**: Volume good but customer count low - few large customers
   - **At Risk (at_risk)**: Overall HGO average 50-80%
   - **Melting (melting)**: Stock metrics good but flow low - losing momentum
   - **Ticket Size (ticket_size)**: Customer count good but volume low - small transactions
   - **Critical (critical)**: Overall HGO average < 50%

5. **Product Performance Table**
   - Dual-row structure per product (Stock row + Flow row)
   - Stock metrics: count, HGO%, YTD delta, MTD delta, volume, volume HGO%
   - Flow metrics: count, HGO%, YTD delta, MTD delta, volume, volume HGO%
   - Actions column: planned/pending action counts
   - Status badge with color-coded styling
   - Row click navigates to /customers?product={productId}
   - "Create Records" button to generate sample data for selected period
   - "Regenerate Insights" button when data exists

**Status Calculation Logic:**
```
stockAvg = (stock_count_tar + stock_volume_tar) / 2
flowAvg = (flow_count_tar + flow_volume_tar) / 2
countAvg = (stock_count_tar + flow_count_tar) / 2
volumeAvg = (stock_volume_tar + flow_volume_tar) / 2
overallAvg = (all four tar values) / 4

If stockAvg >= 80 && flowAvg < 80: 'melting'
If stockAvg < 80 && flowAvg >= 80: 'growing'
If countAvg >= 80 && volumeAvg < 80: 'ticket_size'
If countAvg < 80 && volumeAvg >= 80: 'diversity'
If overallAvg < 50: 'critical'
If overallAvg < 80: 'at_risk'
Else: 'on_track'
```

**Status Grouping:**
| Base Category | Sub-Statuses |
|---------------|--------------|
| Yolunda (On Track) | on_track, growing, diversity |
| Riskli (At Risk) | at_risk, melting, ticket_size |
| Kritik (Critical) | critical |

**Table Columns:** Product Name, Category, Type (Stock/Flow), Count, HGO%, YTD Change, MTD Change, Volume, Volume HGO%, Volume YTD, Volume MTD, Actions, Status

**Data Sources:** portfolio_targets, products, actions

**Technical Files:** `src/pages/ProductPerformance.tsx`, `src/components/dashboard/ProductPerformanceTable.tsx`, `src/hooks/usePortfolioTargets.ts`

---

### Customer Journey (/customer-journey)

**Business Purpose:** Visual customer progression roadmap showing how customers move through relationship stages from new customer to primary bank status. Provides actionable development strategies and one-click navigation to filtered customer lists.

**Key Features:**

1. **SVG Road Visualization**
   - Curved road path with gradient background (muted/50 to muted)
   - Dashed center line for visual effect
   - Responsive SVG with viewBox="0 0 1200 200"
   - Semi-transparent road stroke with 60px width

2. **Pin Markers on Road**
   - Five color-coded circular pins positioned along the curve
   - Each pin has: rounded icon container, status icon, pin tail triangle
   - Pins positioned at varying heights following the curve (60%, 45%, 35%, 20%, 10% from top)
   - Hover effect: scale-110 transform with shadow-lg
   - Customer count displayed below each marker

3. **Stage Legend**
   - Horizontal layout below road visualization
   - Color dots with status labels
   - Arrow separators between stages (hidden on mobile)
   - Responsive wrap on smaller screens

4. **Stage Description Cards (5-column grid)**
   - Left border accent matching stage color
   - Icon with light background tint
   - Status title and detailed description
   - Responsive: 1 column mobile, 2 tablet, 5 desktop

5. **Development Strategy Cards**
   - Shows "From → To" progression (e.g., "Aktif → Target")
   - Customer count subtitle ("X müşteriyi bir üst seviyeye taşı")
   - Actionable tips checklist with CheckCircle2 icons
   - "View Customers" button with Sparkles icon
   - Deep-links to /customers?status={status_key}
   - Only shows 4 cards (first 4 stages, since Ana Banka has no next stage)

6. **Summary Statistics Section**
   - 5-column percentage breakdown per stage
   - Shows percentage of total portfolio
   - Customer count in parentheses
   - Rounded muted background cards

**Journey Stages:**

| Stage | Icon | Color | Description (TR) | Description (EN) |
|-------|------|-------|------------------|------------------|
| Yeni Müşteri | Users | emerald-500 | Yeni kazanılmış ve aktif olan müşteriler | Newly acquired and active customers |
| Aktif | TrendingUp | sky-500 | Aktiflik kriterlerinden en az birini sağlamış | Meeting at least one activity criteria |
| Target | Target | blue-500 | Segmentin hedef müşteri tanımına göre etkin | Active based on segment target definitions |
| Strong Target | Star | indigo-500 | Segmentin güçlü müşteri tanımına göre etkin | Active based on strong customer definitions |
| Ana Banka | Building2 | primary | En yoğun çalışma yapılan ana banka | Primary bank with highest engagement |

**Development Tips by Stage:**

| From Stage | Tips (TR) | Tips (EN) |
|------------|-----------|-----------|
| Yeni Müşteri | İlk görüşmeyi planla, İhtiyaç analizi yap, Temel ürünleri tanıt | Schedule first meeting, Conduct needs analysis, Introduce basic products |
| Aktif | Ürün kullanımını artır, Çapraz satış fırsatları, Düzenli ziyaret planla | Increase product usage, Cross-sell opportunities, Plan regular visits |
| Target | Cüzdan payını analiz et, Rekabet analizi yap, Özelleştirilmiş teklifler sun | Analyze wallet share, Conduct competitor analysis, Offer customized deals |
| Strong Target | Premium ürünler sun, İlişkiyi derinleştir, Stratejik ortaklık kur | Offer premium products, Deepen relationship, Build strategic partnership |

**Progression Flow:** Yeni Müşteri → Aktif → Target → Strong Target → Ana Banka

**Navigation:** Clicking "View Customers" button navigates to `/customers?status={stage.key}` where Customers page reads URL parameter and pre-filters the list.

**Data Sources:** customers table (status column for counts)

**Technical Files:** `src/pages/CustomerJourney.tsx`

---

### Primary Bank (/primary-bank)

**Business Purpose:** Share of wallet analysis and competitive positioning dashboard. Shows overall principality score aggregated across filtered customers, with breakdowns into external market data and internal product metrics. Provides navigation to the data generation engine.

**Key Features:**

1. **Header with Navigation**
   - Back button (ArrowLeft) to return to previous page
   - Page title and subtitle with localized text
   - "Veri Motoru" (Engine) button with Cog icon navigates to /primary-bank/engine

2. **Segment/Sector Filters**
   - Two dropdown selectors in a card layout
   - Segment filter: MİKRO, Kİ, OBİ, TİCARİ (from SEGMENTS constant)
   - Sector filter: Turizm, Ulaşım, Perakende, etc. (from SECTORS constant)
   - "Tümü" (All) option to show all customers
   - Filters trigger refetch of customers and primary bank data
   - Icons: Users for segment, Factory for sector

3. **Main Score Card**
   - Large percentage display (5xl font, primary color)
   - Subtitle shows selected segment/sector labels with description
   - Score explanation text below
   - Loading state displays "..." while data fetching

4. **External Data Section (Banka Dışı Veriler)**
   - 4-column grid with metric cards
   - **Loans (Krediler)**: Banknote icon, loan share percentage, progress bar
   - **POS**: Receipt icon, POS share percentage, progress bar
   - **Cheque (Çek)**: FileCheck icon, cheque share percentage, progress bar
   - **Collateral (Teminat)**: Shield icon, collateral share percentage, progress bar
   - Each card has: icon header, 3xl percentage value, progress bar, description text

5. **Internal Data Section (Banka İçi Veriler)**
   - 4-column grid with axis cards
   - **Products Axis (Ürün Ekseni)**: Package icon
   - **Transactional Axis (İşlem Ekseni)**: CreditCard icon
   - **Liabilities Axis (Pasif Ekseni)**: PiggyBank icon
   - **Assets Axis (Aktif Ekseni)**: Wallet icon
   - Axis scores derived from overall score with ±15% random variance
   - Each card has: icon header, 3xl percentage value, progress bar, description text

6. **Progress Bar Color Logic**
   - Score >= 80%: success (green)
   - Score >= 60%: warning (amber)
   - Score < 60%: destructive (red)

7. **Bottom Explanation Card**
   - Full-width card with contextual explanation
   - Describes how principality score is calculated and used

**Principality Score Formula:**
```
overallScore = loanShare * 0.4 + posShare * 0.3 + chequeShare * 0.2 + collateralShare * 0.1
```

**Weights:**
- Loan Share: 40% (most important)
- POS Share: 30%
- Cheque Share: 20%
- Collateral Share: 10%

**Share Calculations:**
- **Loan Share**: (our_bank cash + non_cash) / (all banks cash + non_cash) * 100
- **POS Share**: Average of pos_share across customers with POS volume > 0
- **Cheque Share**: (customers with cheque_volume_12m > 0) / (total customers) * 100
- **Collateral Share**: (our_bank group1-4 amounts) / (all banks group1-4 amounts) * 100

**Dynamic Weighting:** If a customer lacks data for a specific product category, that category's weight is excluded from the denominator to prevent unfair score penalties.

**Data Sources:** primary_bank_loan_summary, primary_bank_pos, primary_bank_cheque, primary_bank_collateral, customers

**Technical Files:** `src/pages/PrimaryBank.tsx`, `src/hooks/usePrimaryBankData.ts`

---

### Primary Bank Engine (/primary-bank/engine)

**Business Purpose:** AI-powered batch processing engine to generate primary bank data for the entire customer portfolio.

**Features:**
- Batch data generation for entire portfolio
- Progress tracking with pause/resume
- State persistence across page refreshes
- Overwrite existing data option
- Manual generation for individual customers
- Record month selection for historical data

**Technical Files:** `src/pages/PrimaryBankEngine.tsx`, `supabase/functions/generate-primary-bank-data/index.ts`

---

### Customers (/customers)

**Business Purpose:** Customer portfolio management with advanced search, multi-filter capabilities, AI-powered customer generation, and seamless navigation to individual customer details. Supports action-level search with deep-linking.

**Key Features:**

1. **Header with AI Customer Generation**
   - Page title, description, breadcrumb
   - "Generate Customer" button with Sparkles icon
   - Opens CreateCustomerModal for AI-powered batch customer creation

2. **Debounced Search (300ms)**
   - Custom useDebounce hook for smooth, flicker-free filtering
   - Searches across: customer names, action names, group names
   - Client-side filtering for performance (keepPreviousData pattern)
   - When action matches search, clickable action links appear below customer name

3. **Multi-Filter System**
   - **Status Filter**: Yeni Müşteri, Aktif, Target, Strong Target, Ana Banka
   - **Product Filter**: Filter by product ownership (syncs with URL ?product=)
   - **Group Filter**: Customer group/holding company (syncs with URL ?group=)
   - **Action Status Filter**: Beklemede, Planlandı (first 3 action statuses)
   - All filters sync with URL parameters for deep-linking

4. **Customer Table**
   - **Customer Name**: Font-medium name with matching action links below
   - **Group**: Badge with Users icon, clickable to filter by group
   - **Sector**: Localized sector label
   - **Segment**: Localized segment label (MİKRO, Kİ, OBİ, TİCARİ)
   - **Status**: Color-coded badge (emerald=Ana Banka, amber=Strong Target, sky=Target, slate=Aktif/Yeni)
   - **Products**: Badge with Package icon showing product count
   - **Actions**: Planned (green) / Pending (amber) format
   - **Last Activity**: Date or '-' if null
   - Row click navigates to /customers/{id}

5. **Action Search Linking**
   - When search matches action names, action links appear below customer name
   - Links navigate to `/customers/{id}?action={actionId}`
   - Customer Detail page reads ?action= param to auto-open action modal
   - Shows up to 3 matching actions with "+N more" for overflow

6. **URL Parameter Sync**
   - ?status= for status filter
   - ?product= for product filter
   - ?group= for group filter
   - Filters initialize from URL on page load
   - URL updates as filters change

7. **Empty State**
   - Users icon with opacity-50
   - "No customers" message with description
   - Shown when filteredCustomers.length === 0

**Status Badge Colors:**
| Status | Background | Text |
|--------|------------|------|
| Ana Banka | bg-emerald-600 | text-white |
| Strong Target | bg-amber-500 | text-white |
| Target | bg-sky-500 | text-white |
| Aktif | bg-slate-400 | text-white |
| Yeni Müşteri | bg-slate-200 | text-slate-600 |

**URL Parameters:** `?status=`, `?product=`, `?group=`

**Data Sources:** customers, customer_groups, products, actions, customer_products

**Technical Files:** `src/pages/Customers.tsx`, `src/components/customer/CreateCustomerModal.tsx`

---

### Customer Detail (/customers/:customerId)

**Business Purpose:** Comprehensive single-customer view with four view modes for analyzing customer relationship, managing products, tracking actions, and automating workflows. Supports deep-linking to specific actions.

**Key Features:**

1. **Customer Header**
   - Breadcrumb: Customers → {customer.name}
   - Customer name (2xl bold) with status badge
   - Sector · Segment subtitle
   - Clickable area opens PrincipalityScoreModal for detailed breakdown

2. **AI Customer Summary (Collapsible)**
   - Collapsed by default showing only "Customer Status"
   - Expands to reveal AI-generated insights
   - Uses AICustomerSummary component
   - Shows customer data, products summary, actions count

3. **View Mode Navigation (Tab-style)**
   - **Primary Bank** (Building2 icon): Customer-specific share of wallet analysis
   - **Products**: Product cards with threshold comparison
   - **Actions**: Sortable action table with filters
   - **Autopilot** (Bot icon): Pre-configured workflow templates
   - Click to switch, active mode highlighted with foreground color

4. **Products View Mode**
   - 3-column responsive grid of product cards
   - **Owned Products**: Show current value, threshold, gap (green/red)
   - **Not-Owned Products**: Show threshold from sector/segment lookup, "Not owned" label, muted styling
   - Action badge: Shows "X/Y planned" or "X actions"
   - Card click behavior:
     - If has actions → Opens ActionPlanningModal with product's actions
     - If no actions → Opens AddActionModal with product pre-selected
   - Products sorted by display_order

5. **Actions View Mode**
   - **Filters**: Priority dropdown, Status dropdown
   - **Buttons**: "Generate Actions" (AI, Sparkles icon), "Add New Action" (Plus icon)
   - **Sortable Table** with 7 columns:
     - Product (sortable)
     - Action Name (sortable)
     - Type (sortable with ACTION_TYPE_LABELS)
     - Priority (sortable, color-coded badge)
     - Status (sortable, variant badge)
     - Gap (sortable, red if positive gap)
     - Planned Date (sortable)
   - Sort direction toggle (asc/desc)
   - Row click opens ActionPlanningModal

6. **Generate Actions (AI)**
   - Calls `generate-actions` edge function
   - Sends customer info + products + owned product IDs
   - Creates actions with type 'model_based', creator 'AI Action Generator'
   - Target date set to end of current month
   - Toast notification on success/failure

7. **Action Deep-linking**
   - URL: `/customers/{id}?action={actionId}`
   - On load, reads ?action= param
   - Switches to Actions view mode
   - Opens ActionPlanningModal with that action

8. **Modals**
   - **ActionPlanningModal**: Multi-action planning/editing
   - **AddActionModal**: Create new action with product pre-selection
   - **PrincipalityScoreModal**: Detailed principality breakdown

**Priority Badge Colors:**
| Priority | Variant |
|----------|---------|
| high | destructive (red) |
| medium | default |
| low | secondary |

**Status Badge Variants:**
| Status | Variant |
|--------|---------|
| Tamamlandı | default |
| Planlandı | outline |
| Beklemede | secondary |

**Data Sources:** customers, customer_products, products, product_thresholds, actions

**Technical Files:** `src/pages/CustomerDetail.tsx`, `src/components/customer/PrimaryBankPanel.tsx`, `src/components/customer/AICustomerSummary.tsx`, `src/components/customer/AutoPilotPanel.tsx`, `src/components/customer/PrincipalityScoreModal.tsx`, `src/components/actions/ActionPlanningModal.tsx`, `src/components/actions/AddActionModal.tsx`

---

### Actions Agenda (/agenda)

**Business Purpose:** Calendar-based action planning and management with multiple view modes (Daily, Weekly, Monthly, List). Provides status filtering, AI-powered day planning, and seamless navigation to action details. View preferences are persisted to user settings.

**Key Features:**

1. **View Mode Tabs (Persisted)**
   - Daily: Single day view with full action cards
   - Weekly: 7-day horizontal list with compact action chips
   - Monthly: Calendar grid with Monday-based week start
   - List: Searchable, filterable, paginated table view
   - View preference saved to user_settings.preferred_agenda_view on change

2. **Status Filter Row (Multi-Select)**
   - 6 status filter buttons with checkbox toggles
   - Statuses: Beklemede (Pending), Planlandı (Planned), Tamamlandı (Completed), Ertelendi (Postponed), İlgilenmiyor (Not Interested), Uygun Değil (Not Suitable)
   - Each button shows total action count for that status
   - Multiple statuses can be selected simultaneously
   - At least one status must remain selected (prevents empty selection)
   - Default selection: Beklemede + Planlandı

3. **Date Navigation**
   - Previous/Next buttons adjust by day (daily/list), week (weekly), or month (monthly)
   - "Today" button jumps to current date
   - Header text adapts: full date (daily), week range (weekly), month/year (monthly)
   - Clicking a day number in monthly/weekly view switches to daily view for that date

4. **AI Plan My Day Integration**
   - Empty date cells show "Planla" button with Sparkles icon
   - Clicking navigates to /ai-assistant?prompt=plan-my-day&date=YYYY-MM-DD
   - Global empty state also shows AI planning call-to-action
   - AI suggestions can be saved as actions with the target date

5. **Monthly View Grid**
   - 7-column grid with Monday-based week start (Mon, Tue, ..., Sun)
   - Weekend columns styled with muted text color
   - Today highlighted with primary ring border
   - Weekend day cells have muted background
   - Shows up to 3 action links per day with "+N more" overflow
   - Action links navigate to /customers/{id}?action={actionId}
   - Priority-colored action badges (destructive/warning/muted)

6. **Weekly View List**
   - Horizontal layout: date sidebar + actions area
   - Date sidebar shows day name and clickable date number
   - Today row has primary background tint
   - Weekend rows have muted background
   - Actions displayed as inline chips with customer name, action name, status badge
   - Empty rows show "Planla" button for AI planning

7. **Daily View Cards**
   - Full-width action cards with priority-colored borders
   - Shows action name (link to customer detail), customer name, product name
   - Status badge with icon (Clock, Calendar, CheckCircle, PauseCircle, XCircle)
   - Today card highlighted with primary ring border

8. **List View Table**
   - Search input with magnifying glass icon (filters by action name, customer name, product name)
   - Priority filter dropdown (All, High, Medium, Low)
   - Status filter dropdown (All, Beklemede, Planlandı)
   - 6-column table: Action (with description), Customer, Product, Priority, Status, Date
   - Action name links to /customers/{id}?action={actionId}
   - Customer name links to /customers/{id}
   - Pagination with 10 items per page
   - Page numbers with Previous/Next navigation
   - "Showing X-Y of Z" counter

9. **Action Date Logic**
   - Uses current_planned_date if set
   - Falls back to action_target_date for pending actions
   - Actions sorted by date within each view

10. **Status Configuration**
    - **Beklemede**: Clock icon, amber color, secondary variant
    - **Planlandı**: Calendar icon, primary color, default variant
    - **Tamamlandı**: CheckCircle2 icon, emerald color, outline variant
    - **Ertelendi**: PauseCircle icon, slate color, secondary variant
    - **İlgilenmiyor**: XCircle icon, destructive color, destructive variant
    - **Uygun Değil**: XCircle icon, destructive color, destructive variant

**Priority Badge Colors:**
| Priority | Background | Text |
|----------|------------|------|
| high | bg-destructive/10 | text-destructive |
| medium | bg-warning/10 | text-warning |
| low | bg-muted | text-muted-foreground |

**URL Parameters:** `?status=Planlandı` or `?status=Beklemede` (pre-filters on load)

**Data Sources:** actions, customers, products

**Technical Files:** `src/pages/ActionsAgenda.tsx`, `src/hooks/useActions.ts`, `src/hooks/useUserSettings.ts`

---

### Customer Experience (/customer-experience)

**Business Purpose:** Comprehensive customer experience index tracking 9 variables across 6 critical "key moments" in the customer lifecycle. Provides overall score visualization, trend analysis, detailed breakdowns, and AI-powered action recommendations to improve underperforming metrics.

**Key Features:**

1. **Page Header**
   - Back button to Dashboard
   - Title: "Müşteri Deneyim Skoru" with Users icon
   - Subtitle: "Customer Experience Index - 6 Kritik An, 9 Değişken"
   - Date selector (current month + last 3 months) syncs all components

2. **Overall Score Hero Card**
   - Left section: Target icon, title, score display (X/100)
   - Status summary badges: Yolunda (success), Riskli (warning), Kritik (critical) with counts
   - Center: 3-month trend line chart with value labels
     - Gradient line from muted-foreground to primary
     - Trend direction indicator (TrendingUp/Down) with point difference
     - Month labels on x-axis
   - Right: Circular progress visualization
     - SVG donut chart with score arc
     - Target threshold dashed line at 75%
     - Color-coded by status (success/warning/destructive)
     - Center percentage label

3. **Score Status Thresholds**
   - Success (Green): score >= 75%
   - Warning (Amber): score >= 50% but < 75%
   - Critical (Red): score < 50%

4. **Key Moments Grid (6 cards)**
   - 3-column responsive grid
   - Each card displays: icon, name (TR + EN), score, target, status icon, progress bar with target marker
   - Variable count footer with "Detay" link
   - Clickable to open detail dialog
   - Corporate design: muted backgrounds, neutral tokens

5. **6 Key Moments with Calculations:**

   | Key Moment | Variables | Target | Calculation |
   |------------|-----------|--------|-------------|
   | Müşteri Ziyareti (Customer Visit) | visit_count / active_customers | 50% | Visit rate percentage |
   | Acil Finansal Destek (Urgent Financial Support) | customers_with_open_limit / active_customers | 60% | Open limit customer percentage |
   | Dijital Kanal (Digital Channel) | login success rate (95%), help desk rate (50%) | 72.5% | Average of both rates |
   | Kritik Ödemeler (Critical Payments) | digital salary rate (60%), payment success rate (90%) | 75% | Average of both rates |
   | Nakit Yönetimi (Cash Management) | ete_product_score | 60% | ETE product score directly |
   | Hızlı Destek (Quick Support) | complaint rate (<5%), NPS rate (80%) | 87.5% | Inverse complaint + NPS average |

6. **Key Moment Detail Dialog**
   - Opens on card click
   - Shows status icon + name in header
   - Current score vs target display
   - Variables list with individual progress bars
   - Target marker on each progress bar
   - Formula display for each variable

7. **AI Action Panel**
   - Sparkles icon header with "Öneri Oluştur" (Generate) button
   - Calls `generate-experience-actions` edge function
   - Only generates for non-success key moments
   - Displays pending/in-progress actions in scrollable list
   - Each action card shows:
     - Priority icon with colored border
     - Recommendation text
     - Key moment badge + status badge
     - AI reasoning (💡 prefix)
     - Customer link with navigation
     - Action buttons: Başla (Start), Reddet (Dismiss), Tamamla (Complete)
   - Status workflow: pending → in_progress → completed/dismissed

8. **Action Priority Configuration:**
   - High: destructive/10 background, AlertTriangle icon
   - Medium: warning/10 background, Clock icon
   - Low: muted background, CheckCircle2 icon

9. **Action Status Labels:**
   - pending: "Beklemede"
   - in_progress: "Devam Ediyor"
   - completed: "Tamamlandı"
   - dismissed: "Reddedildi"

10. **Key Moment Icons:**
    - customer-visit: Users
    - urgent-financial-support: CreditCard
    - digital-channel: Smartphone
    - critical-payments: Wallet
    - cash-management: Banknote
    - quick-support: HeadphonesIcon

**Overall Score Calculation:**
```
overallScore = sum(all keyMoment scores) / 6
```

**Data Sources:** customer_experience_metrics, customer_experience_actions, customers

**Technical Files:** `src/pages/CustomerExperience.tsx`, `src/components/customer-experience/KeyMomentCard.tsx`, `src/components/customer-experience/AIActionPanel.tsx`, `src/hooks/useCustomerExperienceMetrics.ts`, `src/hooks/useCustomerExperienceActions.ts`, `supabase/functions/generate-experience-actions/index.ts`

---

### AI Assistant (/ai-assistant)

**Business Purpose:** Conversational AI interface for portfolio intelligence. Provides a persistent chat experience for portfolio managers to analyze customers, get prioritization recommendations, and plan their day with AI-generated action suggestions that can be saved directly to the database.

**Key Features:**

1. **Page Layout (2-panel grid)**
   - Left sidebar (1/4 width): Session list with new chat button
   - Main chat area (3/4 width): Message display, input form, token counter
   - Fixed height: `calc(100vh - 220px)` for optimal scrolling

2. **Chat Session Management**
   - Sessions stored in `ai_chat_sessions` table, linked to portfolio_manager_id
   - Session list sorted by `updated_at` descending (newest first)
   - Each session shows: title (truncated), date/time, 3-dot dropdown menu
   - Auto-select first session on page load if exists
   - New session button (Plus icon) creates session with default title "Yeni Sohbet"
   - Session title auto-updates to first user message (first 50 chars + ellipsis)
   - Delete session via dropdown menu with confirmation toast

3. **Session List Item Design**
   - Active session: Primary background with border, bold title
   - Hover state: Muted background
   - MessageSquare icon, title, timestamp display
   - Delete button appears on hover (trash icon)

4. **Chat Header**
   - Sparkles icon with violet gradient background
   - Title "Aksiyon Asistanı" with subtitle
   - Collapsible privacy notice panel (ShieldCheck icon)
   - Privacy details: 4 bullet points explaining data handling

5. **Welcome Message**
   - Displayed when session has no messages
   - Static content with example prompts:
     - "Bu hafta hangi müşterilere öncelik vermeliyim?"
     - "Perakende sektöründeki yüksek potansiyelli müşterileri bul"
     - "Kredi ürünleri için takip gereken müşteriler kim?"

6. **Message Display**
   - User messages: Primary background, right-aligned, rounded corners (rounded-br-md)
   - Assistant messages: Muted background, left-aligned, rounded corners (rounded-bl-md)
   - Bot icon with violet gradient for assistant messages
   - User icon with primary background for user messages
   - fade-in animation for new messages
   - Provider/model metadata footer for assistant messages (e.g., "lovable · openai/gpt-5-mini")
   - Auto-scroll to bottom when new messages arrive

7. **Message Parsing & Customer Links**
   - Customer temp IDs (C1, C2, etc.) in responses converted to clickable links
   - Links navigate to `/customers/{customerId}`
   - Customer name displayed instead of temp ID
   - Bold text parsing for `**text**` patterns

8. **Plan My Day Feature**
   - Triggered by: typing "plan my day" or "günümü planla" 
   - URL trigger: `?prompt=plan-my-day&date=YYYY-MM-DD` (from Agenda page)
   - Creates new session with title "{date} Planı" or "Günümü Planla"
   - AI response parsed as JSON with: greeting, customers array, summary
   - Renders `PlanMyDayDisplay` component for structured output
   - Target date passed through for action creation

9. **PlanMyDayDisplay Component**
   - Structured display of AI plan response
   - Each customer shows: numbered name (clickable link), reason, action list
   - Actions format: "Product → Action (note)"
   - Save button per action: Save/Check/Loader states
   - Normalized key matching to detect already-saved actions
   - Saved actions create database records with:
     - `action_target_date`: Target date from plan or current date
     - `current_status`: "Planlandı"
     - `creator_name`: "AI Assistant"
     - `creation_reason`: Customer reason from AI
     - `type`: "rm_action"

10. **Chat Input Form**
    - Text input with rounded styling
    - Send button (icon only)
    - Disabled state when loading or no active session
    - Enter key submits message
    - Auto-focus on session change

11. **Token Usage & Cost Tracking**
    - Footer bar showing: total tokens, input/output breakdown
    - Estimated cost calculation: $0.15/1M input, $0.60/1M output
    - Coins icon with amber accent
    - Format: "1,234 tokens (↑800 / ↓434) $0.0012 est."

12. **AI Context Preparation**
    - All customers with products included
    - Each customer includes:
      - tempId (C1, C2, etc.) for privacy
      - name, segment, sector, status, principality_score
      - products array with threshold and gap calculations
      - belowThresholdProducts filtered list
      - existing actions
    - Action templates with product→action mappings
    - Chat history (last 5 messages)

13. **Loading States**
    - Loader spinner in chat area with message "Portföyünüz analiz ediliyor..."
    - Disabled input and send button during API call
    - Session creation disabled during pending state

**Edge Function (ai-action-assistant):**
- Authenticates via JWT
- Fetches user's AI provider settings from user_settings
- Builds system prompt based on request type:
  - Plan My Day: Structured JSON output with 5 customers, 2-3 actions each
  - Regular query: Conversational response with customer references
- Includes action templates for valid product→action pairings
- Returns: content, usage, isPlanMyDay flag, provider, model

**Plan My Day Prompt Rules:**
- Select top 5 customers by priority (Strong Target > Target > others) and PS score
- 2-3 actions per customer using exact template names
- No product duplication within same customer
- Product names must match exactly from allowed list
- JSON format: `{ greeting, customers[], summary }`

**Data Sources:** ai_chat_sessions, ai_chat_messages, customers, customer_products, products, actions, action_templates, product_thresholds, user_settings

**Hooks Used:** useAIChatSessions, useAIChatMessages, useCreateChatSession, useUpdateChatSessionTitle, useDeleteChatSession, useAddChatMessage, useCustomers, useAllCustomerProducts, useProducts, useActions, useAllActionTemplates, useProductThresholds, useUserSettings, useLanguage

**URL Parameters:**
- `?prompt=plan-my-day` - Triggers Plan My Day workflow
- `?date=YYYY-MM-DD` - Target date for plan (optional, defaults to today)

**Technical Files:** `src/pages/AIAssistant.tsx`, `src/components/ai/PlanMyDayDisplay.tsx`, `src/hooks/useAIChatSessions.ts`, `src/lib/planMyDayMessage.ts`, `supabase/functions/ai-action-assistant/index.ts`

---

### Thresholds (/thresholds)

**Business Purpose:** Product threshold management (admin-only editing).

**Table Columns:** Product, Sector, Segment, Threshold Value, Calculation Date, Version, Active Status

**Role Access:**
- Admin: Full edit access
- User: Read-only view

**Technical Files:** `src/pages/Thresholds.tsx`

---

### Settings (/settings)

**Business Purpose:** Technical configuration for AI provider, voice settings, and SQL queries.

**Sections:**
1. AI Provider Settings (Lovable, OpenAI, OpenRouter, Local)
2. ElevenLabs Voice Settings
3. SQL Query Panel

**Technical Files:** `src/pages/Settings.tsx`, `src/components/settings/AIProviderSettings.tsx`

---

### Preferences (/preferences)

**Business Purpose:** User personalization settings.

**Settings:**
- Language (Turkish, English, Spanish)
- Preferred Agenda View (Daily, Weekly, Monthly, List)
- Documentation access

**Technical Files:** `src/pages/Preferences.tsx`

---

## Database Schema

### Core Tables

#### customers
Stores corporate customer records with their relationship status.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Customer company name |
| sector | customer_sector | Business sector (Turizm, Ulasim, etc.) |
| segment | customer_segment | Size segment (MIKRO, KI, OBI, TICARI) |
| status | customer_status | Relationship status |
| principality_score | number | Primary bank score (0-100) |
| portfolio_manager_id | uuid | FK to portfolio_managers |
| group_id | uuid | FK to customer_groups |

---

#### actions
Stores sales and relationship actions for customers.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| customer_id | uuid | FK to customers |
| product_id | uuid | FK to products |
| name | text | Action name |
| type | action_type | model_based, ad_hoc, rm_action, recursive |
| priority | action_priority | high, medium, low |
| current_status | action_status | Beklemede, Planlandy, Tamamlandy, etc. |
| action_target_date | date | Target completion date |
| current_planned_date | date | Actual planned date |
| target_value | number | Target transaction value |
| current_value | number | Achieved value |

**Action Status Flow:** Beklemede -> Planlandy -> Tamamlandy/Ertelendi/Ilgilenmiyor/Uygun Degil

---

#### products
Banking product catalog.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Product name |
| category | product_category | Kredi, Kaynak, Odeme, Tahsilat, Sigorta, Istirak |
| is_external | boolean | Whether data comes from external sources |

---

#### customer_products
Junction table for customer-product relationships.

| Column | Type | Description |
|--------|------|-------------|
| customer_id | uuid | FK to customers |
| product_id | uuid | FK to products |
| current_value | number | Current product value |
| external_data | number | External data value |

**Gap Calculation:** `gap = threshold_value - current_value`

---

#### product_thresholds
Target threshold values per sector/segment/product.

| Column | Type | Description |
|--------|------|-------------|
| product_id | uuid | FK to products |
| sector | customer_sector | Customer sector |
| segment | customer_segment | Customer segment |
| threshold_value | number | Target value threshold |
| is_active | boolean | Whether active |

---

#### portfolio_targets
Portfolio-level target metrics.

| Column | Type | Description |
|--------|------|-------------|
| portfolio_manager_id | uuid | FK to portfolio_managers |
| product_id | uuid | FK to products |
| record_date | date | Period date (YYYY-MM) |
| stock_count | number | Current customer count |
| stock_count_target | number | Target customer count |
| stock_count_tar | number | HGO% (actual/target*100) |
| stock_volume | number | Current volume |
| flow_count | number | New acquisitions count |
| flow_volume | number | New volume |

**Metrics:**
- **Stock** = Current state (total at a point in time)
- **Flow** = Change (new acquisitions during period)
- **TAR/HGO%** = Target Achievement Ratio

---

### Primary Bank Tables

#### primary_bank_loan_summary
Bank-level loan summary data per customer.

| Column | Description |
|--------|-------------|
| bank_code | Bank identifier |
| cash_loan | Cash loan amount |
| non_cash_loan | Non-cash loan amount |
| our_bank_flag | True if our bank |

**Loan Share Calculation:** `loanShare = (our_bank cash+non_cash) / (all banks) * 100`

---

#### primary_bank_pos
POS transaction volume data.

| Column | Description |
|--------|-------------|
| total_pos_volume | Total POS volume across all banks |
| our_bank_pos_volume | Our bank's POS volume |
| pos_share | Our share percentage |

---

#### primary_bank_cheque
Cheque processing volume data.

| Column | Description |
|--------|-------------|
| cheque_volume_1m | Volume last 1 month |
| cheque_volume_3m | Volume last 3 months |
| cheque_volume_12m | Volume last 12 months |

**Activity Check:** `chequeActive = cheque_volume_12m > 0`

---

#### primary_bank_collateral
Collateral registration data.

| Column | Description |
|--------|-------------|
| bank_code | Bank identifier |
| group1_amount - group4_amount | Collateral amounts by group |
| our_bank_flag | True if our bank |

---

## KPI Definitions

### Benchmark Score
**What it measures:** Portfolio performance by counting product metrics achieving >=75% of target.

**Formula:** `(count of HGO% >= 75) / (total HGO metrics)`

**Display:** X/Y format (e.g., "12/16")

---

### Primary Bank Score
**What it measures:** Percentage of customers where we are the primary bank.

**Formula:** `(customers with status 'Ana Banka') / (total customers) * 100`

---

### Principality Score (Share of Wallet)
**What it measures:** How much of a customer's banking business is with us.

**Formula:** `loanShare*0.4 + posShare*0.3 + chequeShare*0.2 + collateralShare*0.1`

**Interpretation:** Higher score = dominant banking partner

---

### HGO% (Target Achievement Ratio)
**What it measures:** Hedef Gerceklesme Orani - Percentage of target achieved.

**Formula:** `(actual value / target value) * 100`

**Thresholds:**
- Good: >=80%
- Medium: 50-80%
- Bad: <50%

---

### Product Gap
**What it measures:** Difference between threshold and current value.

**Formula:** `gap = threshold_value - current_value`

**Interpretation:** Positive gap = opportunity to grow

---

## Enum Values Reference

### Customer Status (customer_status)
| Value | English | Description |
|-------|---------|-------------|
| Yeni Musteri | New Customer | Recently acquired |
| Aktif | Active | Regular transactions |
| Target | Target | Growth potential |
| Strong Target | Strong Target | Close to primary bank |
| Ana Banka | Primary Bank | Main banking partner |

---

### Action Status (action_status)
| Value | English | Description |
|-------|---------|-------------|
| Beklemede | Pending | Not yet planned |
| Planlandy | Planned | Scheduled |
| Tamamlandy | Completed | Successfully completed |
| Ertelendi | Postponed | Delayed |
| Ilgilenmiyor | Not Interested | Customer declined |
| Uygun Degil | Not Suitable | Product not suitable |

---

### Action Priority (action_priority)
| Value | Description | UI Color |
|-------|-------------|----------|
| high | Urgent, high-value | Red |
| medium | Standard | Amber |
| low | Lower urgency | Gray |

---

### Action Type (action_type)
| Value | Label | Description |
|-------|-------|-------------|
| model_based | Model | AI-generated |
| rm_action | RM Action | Created by RM |
| ad_hoc | Ad-Hoc | One-time, uploaded |
| recursive | Recursive | Recurring |

---

### Customer Segment (customer_segment)
| Value | English | Description |
|-------|---------|-------------|
| MIKRO | Micro | Smallest segment |
| KI | Small | Small businesses |
| OBI | SME | Small/Medium Enterprises |
| TICARI | Commercial | Largest segment |

---

### Customer Sector (customer_sector)
| Value | English |
|-------|---------|
| Turizm | Tourism |
| Ulasim | Transportation |
| Perakende | Retail |
| Gayrimenkul | Real Estate |
| Tarim Hayvancilik | Agriculture |
| Saglik | Healthcare |
| Enerji | Energy |

---

### Product Category (product_category)
| Value | English | Description |
|-------|---------|-------------|
| Kredi | Loans | Cash and non-cash credit |
| Kaynak | Deposits | Deposit products |
| Odeme | Payments | Payment services |
| Tahsilat | Collections | Collection services |
| Sigorta | Insurance | Insurance products |
| Istirak | Affiliates | Investment products |

---

## Key Features

### Plan My Day
**What it does:** AI-powered daily planning that analyzes portfolio and recommends customers to contact with specific actions.

**How to use:**
1. Click "Plan My Day" button on Dashboard or AI Assistant
2. AI analyzes portfolio
3. Receive prioritized customer list with recommendations
4. Save actions directly from response

**Prioritization factors:**
- Customer status (Strong Target and Target prioritized)
- Principality score (lower = more opportunity)
- Products below threshold
- Recent activity date

**URL Trigger:** `/ai-assistant?prompt=plan-my-day&date=YYYY-MM-DD`

---

### Autopilot Workflows
**What it does:** Pre-configured workflow templates for common banking processes.

**Available workflows:**
- Installment Loan
- Credit Card
- Term Deposit
- Trade Finance

---

## Data Hooks Reference

| Hook | Purpose | Data Sources |
|------|---------|--------------|
| usePortfolioSummary | Aggregated portfolio metrics | customers, actions |
| usePortfolioTargets | Product performance targets | portfolio_targets, products |
| useCustomers | Customer list with filters | customers, customer_groups |
| useCustomerById | Single customer details | customers |
| useCustomerProducts | Customer products with gaps | customer_products, product_thresholds |
| useActions | Action list with filters | actions, customers, products |
| usePrimaryBankData | Share of wallet for multiple customers | primary_bank_* tables |
| useCustomerPrimaryBankData | Share of wallet for single customer | primary_bank_* tables |
| useInsights | AI portfolio insights | ai_insights, portfolio_targets |
| useActionTemplates | Action templates by product | action_templates |
| useUserSettings | User preferences | user_settings |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| ai-action-assistant | Main AI chat handler with Plan My Day |
| generate-insights | Generate portfolio-level AI insights |
| generate-action-insights | Action-specific recommendations |
| generate-actions | AI-generated action creation |
| generate-primary-bank-data | Generate competitive intelligence data |
| generate-customer | Create AI-generated demo customers |
| test-ai-connection | Validate AI provider configuration |
| run-query | Execute read-only SQL queries |

---

## Multi-language Support

**Supported Languages:**
- Turkish (tr) - Primary
- English (en)
- Spanish (es)

**Translation file:** `src/i18n/translations.ts`

---

## Authentication & Security

**Authentication:** Supabase Auth with email/password

**Row Level Security:** Users can only access data belonging to their portfolio (via portfolio_manager_id)

**Roles:**
- `user` - Standard portfolio manager access
- `admin` - Additional access to thresholds, SQL queries, system configuration

---

*Document generated: 2026-01-18*

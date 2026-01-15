# Account Planning System - Technical Documentation

## 1. Project Overview

The Account Planning System is a corporate banking relationship management application designed for portfolio managers to optimize customer relationships and maximize revenue opportunities. Built on **React + Vite + TypeScript + Supabase**, it provides data-driven insights, AI-powered action recommendations, and streamlined customer engagement workflows.

### Key Capabilities
- **Portfolio Management**: Track and manage corporate banking customer portfolios
- **AI-Powered Insights**: Automated recommendations for customer actions and daily planning
- **Primary Bank Analytics**: Share of wallet analysis and competitive intelligence
- **Product Performance Tracking**: Stock/flow metrics with target achievement monitoring
- **Customer Journey Visualization**: Progressive relationship development roadmap
- **Multi-language Support**: Turkish, English, and Spanish interfaces

### Main User Roles

- **Portfolio Manager (Relationship Manager)**: Primary user managing corporate customer portfolios
  - Maximize primary bank status across portfolio
  - Execute AI-recommended and ad-hoc actions
  - Track product penetration per customer
  - Monitor principality scores and customer journeys

- **Administrator**: System configuration and user management
  - Manage product thresholds
  - Configure AI provider settings
  - Access SQL query interface

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| State Management | TanStack Query (React Query) |
| Routing | React Router v7 |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| AI Integration | Lovable AI Gateway (GPT-5, Gemini), ElevenLabs TTS |
| Authentication | Supabase Auth |
| Deployment | Docker + Nginx + Google Cloud Run |

---

## 3. Application Pages & Features

### 3.1 Dashboard (`/`)
**File**: `src/pages/Dashboard.tsx`

The main landing page providing a portfolio overview with:
- **Personalized Greeting**: Time-based greeting with portfolio manager name
- **Date Selector**: View data for current month, last 3 months, quarter ends, or year ends
- **Summary Cards** (`SummaryCards`): Key metrics including total customers, primary bank count, and action statistics
- **Daily Plan Panel** (`DailyPlanPanel`): 
  - Mini calendar with action density visualization (completed actions shown in gradient blue)
  - Daily/weekly/monthly action list
  - "Plan My Day" AI integration button
- **AI Insights Panel** (`InsightsPanel`): AI-generated portfolio insights and recommendations

---

### 3.2 Product Performance (`/product-performance`)
**File**: `src/pages/ProductPerformance.tsx`

Portfolio-level product metrics and target achievement analysis:
- **Hero Summary Panel**: Interactive status cards (On Track, At Risk, Critical)
  - Expandable detail filters with checkbox multi-select
  - Sub-statuses: Growing, Diversity, Melting, Ticket Size
- **Product Performance Table**: 
  - Stock metrics: Count, Volume, Target %, YoY %, MoM %
  - Flow metrics: Count, Volume, Target %, YoY %, MoM %
  - Status badges with color coding
  - Clickable rows navigate to filtered customer lists
- **Date Selector**: Historical period comparison

---

### 3.3 Customer Journey (`/customer-journey`)
**File**: `src/pages/CustomerJourney.tsx`

Visual customer progression roadmap through relationship stages:
- **Journey Visualization**: Interactive SVG road with stage markers
  - Stages: Yeni Müşteri → Aktif → Target → Strong Target → Ana Banka
  - Customer counts per stage with animated markers
- **Stage Description Cards**: Detailed explanation for each stage
- **Development Strategies**: Actionable tips for customer progression
  - Tips for each stage transition
  - "View Customers" buttons with status filter deep-linking
- **Summary Statistics**: Percentage distribution across stages

---

### 3.4 Primary Bank (`/primary-bank`)
**File**: `src/pages/PrimaryBank.tsx`

Share of wallet analysis and competitive positioning:
- **Filter Controls**: Segment and sector dropdowns
- **Overall Principality Score**: Portfolio-wide primary bank percentage
- **External Data Section** (from external sources):
  - Loans Share: Bank's share of customer total loans
  - POS Share: Point-of-sale transaction volume share
  - Cheque Share: Cheque processing volume share
  - Collateral Share: Collateral registration share
- **Internal Data Section** (internal metrics):
  - Products Axis: Product diversity score
  - Transactional Axis: Transaction activity score
  - Liabilities Axis: Deposit and liability score
  - Assets Axis: Lending and asset score
- **Engine Access**: Button to Primary Bank Engine for data generation

---

### 3.5 Primary Bank Engine (`/primary-bank/engine`)
**File**: `src/pages/PrimaryBankEngine.tsx`

AI-powered primary bank data generation engine:
- **Batch Processing**: Generate data for entire customer portfolio
  - Progress tracking with pause/resume capability
  - State persistence across page refreshes
  - Overwrite existing data option
- **Manual Generation**: Generate data for individual customers
- **Record Month Selection**: Historical data generation
- **Customer Results Table**:
  - Status indicators: Pending, Processing, Success, Error, Existing
  - Existing data badges (Summary, Detail, POS, Cheque, Collateral)
  - Delete and regenerate options
- **Generated Data Preview**: Expandable details for each data type
- **AI Provider Display**: Shows which AI model generated the data

---

### 3.6 Customers (`/customers`)
**File**: `src/pages/Customers.tsx`

Customer portfolio management and filtering:
- **Search**: Debounced search across customer names, action names, and group names
- **Filters**:
  - Status: Yeni Müşteri, Aktif, Target, Strong Target, Ana Banka
  - Product: Filter by product ownership
  - Group: Customer group membership
  - Action Status: Filter by action status (Beklemede, Planlandı)
- **Customer Table**:
  - Customer name with matching action quick-links
  - Group badges (clickable for filtering)
  - Sector and segment labels (localized)
  - Status badges with color coding
  - Product count
  - Action counts (Planned/Pending)
  - Last activity date
- **AI Customer Generation**: Modal to create AI-generated demo customers
- **URL Deep-linking**: Supports `?status=`, `?product=`, `?group=` parameters

---

### 3.7 Customer Detail (`/customers/:customerId`)
**File**: `src/pages/CustomerDetail.tsx`

Comprehensive single-customer view with four view modes:

#### Primary Bank View
- **Primary Bank Panel**: Customer-specific share of wallet analysis
- **Principality Score Modal**: Detailed score breakdown with four axes

#### Products View
- **Product Table**: All customer products with:
  - Current value and threshold comparison
  - Gap analysis (opportunity identification)
  - Action counts per product
  - Sorting by product, gap, threshold, etc.
- **Non-Owned Products**: Products the customer doesn't have (cross-sell opportunities)
- **Add Action Button**: Quick action creation from product row

#### Actions View
- **Actions Table**: All customer actions with:
  - Priority (High/Medium/Low) and status badges
  - Sorting and filtering
  - Click to open Action Planning Modal
- **Generate Actions Button**: AI-powered action recommendation
- **Action Planning Modal**: Full action lifecycle management

#### Autopilot View
- **AutoPilot Panel**: Pre-configured workflow templates
  - Installment Loan, Credit Card, Term Deposit, Trade Finance workflows
  - Step tracking (automatic vs human steps)
  - Start new autopilot instance

**Additional Features**:
- **AI Customer Summary** (collapsed by default): AI-generated customer insights
- **Deep-link Support**: `?action=<actionId>` opens specific action

---

### 3.8 Actions Agenda (`/agenda`)
**File**: `src/pages/ActionsAgenda.tsx`

Calendar-based action planning and management:
- **View Modes** (saved to user preferences):
  - Daily: Single day focus
  - Weekly: Week overview with day columns
  - Monthly: Calendar grid with action indicators
  - List: Tabular view with search and pagination
- **Navigation**: Previous/Next period, Today button
- **Action Cards**: Priority badges, customer links, status indicators
- **Filters**: Status (Planlandı, Beklemede), Priority, Search
- **Empty State**: AI suggestion to "Let AI Plan Your Day"
- **URL Parameters**: `?status=Planlandı` or `?status=Beklemede` filtering

---

### 3.9 AI Assistant (`/ai-assistant`)
**File**: `src/pages/AIAssistant.tsx`

Conversational AI interface for portfolio intelligence:
- **Chat Sessions**: Multiple conversation threads
  - Create new sessions
  - Delete sessions
  - Auto-title based on first message
- **Plan My Day Feature**:
  - Automatic customer prioritization
  - Action recommendations per customer
  - Save actions directly from AI suggestions
  - Supports specific date targeting
- **Customer Context**: AI has access to:
  - Customer portfolio data
  - Product holdings and thresholds
  - Existing actions and status
  - Action templates
- **Usage Tracking**: Token usage and cost calculation display
- **Privacy Panel**: Data privacy information (collapsible)
- **URL Trigger**: `?prompt=plan-my-day&date=YYYY-MM-DD`

---

### 3.10 Thresholds (`/thresholds`)
**File**: `src/pages/Thresholds.tsx`

Product threshold management (Admin-only editing):
- **Filters**: Product, Sector, Segment, Active/Inactive status
- **Threshold Table**:
  - Product name
  - Sector and segment
  - Threshold value (formatted currency)
  - Calculation date
  - Version number
  - Active status toggle
- **Edit Modal**: Update threshold value (admin only)
- **Pagination**: 20 items per page
- **Role-based Access**: Non-admins see read-only view

---

### 3.11 Preferences (`/preferences`)
**File**: `src/pages/Preferences.tsx`

User personalization settings:
- **Language Selection**: Turkish, English, Spanish
- **Preferred Agenda View**: Default view mode for Actions Agenda
- **Documentation Link**: Access to README documentation

---

### 3.12 Settings (`/settings`)
**File**: `src/pages/Settings.tsx`

Technical configuration (typically for power users):
- **AI Provider Settings** (`AIProviderSettings`):
  - Provider selection: Lovable (default), OpenAI, OpenRouter, Local
  - Model configuration
  - API key management
  - Base URL for local providers
  - Connection test functionality
- **ElevenLabs Voice Settings** (`ElevenLabsSettings`):
  - Voice selection with preview
  - Voice parameters: Stability, Similarity, Speed, Style
  - Speaker boost toggle
  - Voice history management
- **SQL Query Panel** (`QueryPanel`):
  - Execute read-only SQL queries
  - Save and load queries
  - Results table display

---

### 3.13 Authentication (`/auth`)
**File**: `src/pages/Auth.tsx`

User authentication:
- **Login Tab**: Email and password authentication
- **Sign Up Tab**: New user registration
  - Name, email, password fields
  - Password confirmation
  - Auto-confirm enabled (development mode)
- **Language Selector**: Available on auth page
- **Terms of Agreement**: Displayed in footer

---

### 3.14 Documentation (`/documentation`)
**File**: `src/pages/Documentation.tsx`

Embedded documentation viewer:
- Fetches and renders README.md
- Markdown to HTML conversion
- Navigation back to settings

---

## 4. Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `portfolio_managers` | User profile data linked to auth.users |
| `customers` | Corporate customer records with segment, sector, status |
| `customer_groups` | Holding company structures |
| `products` | Banking product catalog |
| `customer_products` | Customer-product relationship with current values |
| `product_thresholds` | Target values per sector/segment/product |
| `actions` | Sales and relationship actions |
| `action_updates` | Action history and audit trail |
| `action_templates` | Pre-defined action types per product |
| `action_template_fields` | Dynamic form fields for action templates |

### AI & Insights Tables

| Table | Description |
|-------|-------------|
| `ai_insights` | AI-generated portfolio insights |
| `ai_action_insights` | AI-generated action recommendations |
| `ai_chat_sessions` | AI assistant conversation sessions |
| `ai_chat_messages` | Individual chat messages with usage tracking |

### Primary Bank Tables

| Table | Description |
|-------|-------------|
| `primary_bank_loan_summary` | Bank-level loan summary data |
| `primary_bank_loan_detail` | Individual loan account details |
| `primary_bank_pos` | POS transaction share data |
| `primary_bank_cheque` | Cheque processing data |
| `primary_bank_collateral` | Collateral registration data |

### User Settings Tables

| Table | Description |
|-------|-------------|
| `user_settings` | User preferences, AI config, voice settings |
| `user_roles` | User role assignments (admin/user) |
| `saved_queries` | Saved SQL queries per user |
| `elevenlabs_voice_history` | Voice selection history |

---

## 5. Edge Functions

### AI Functions

| Function | Purpose |
|----------|---------|
| `ai-action-assistant` | Main AI chat handler with portfolio context |
| `generate-insights` | Generate portfolio-level AI insights |
| `generate-action-insights` | Generate action-specific recommendations |
| `generate-actions` | AI-generated action creation for customers |
| `generate-primary-bank-data` | Generate competitive intelligence data |
| `generate-customer` | Create AI-generated demo customers |

### Voice & Audio

| Function | Purpose |
|----------|---------|
| `test-elevenlabs-voice` | Test voice settings with ElevenLabs |
| `generate-demo-audio` | Generate audio for demo mode |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `test-ai-connection` | Validate AI provider configuration |
| `run-query` | Execute read-only SQL queries (RLS enforced) |
| `seed-demo-users` | Create demo user accounts |

---

## 6. Key React Hooks

### Data Fetching Hooks

| Hook | Purpose |
|------|---------|
| `usePortfolioManager` | Current user's portfolio manager data |
| `usePortfolioSummary` | Aggregated portfolio metrics |
| `useCustomers` | Customer list with filtering |
| `useCustomerById` | Single customer details |
| `useProducts` | Product catalog |
| `useCustomerProducts` | Customer-product relationships |
| `useActions` | Action list with filtering |
| `useActionTemplates` | Action templates per product |
| `useProductThresholds` | Threshold values |
| `usePortfolioTargets` | Portfolio target metrics |
| `usePrimaryBankData` | Share of wallet calculations |

### AI & Insights Hooks

| Hook | Purpose |
|------|---------|
| `useAIChatSessions` | Chat session management |
| `useAIChatMessages` | Chat message retrieval |
| `useInsights` | Portfolio insights |
| `useActionInsights` | Action recommendations |

### User & Settings Hooks

| Hook | Purpose |
|------|---------|
| `useUserSettings` | User preferences and AI config |
| `useUserRole` | User role (admin/user) |
| `useVoiceHistory` | ElevenLabs voice history |
| `useSessionValidator` | Auth session validation |

---

## 7. Component Architecture

### Layout Components (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main application shell with sidebar |
| `AppHeader` | Top navigation bar |
| `AppSidebar` | Navigation sidebar with menu items |
| `PageBreadcrumb` | Breadcrumb navigation |

### Dashboard Components (`src/components/dashboard/`)

| Component | Purpose |
|-----------|---------|
| `SummaryCards` | Key metric cards |
| `DailyPlanPanel` | Calendar and action list |
| `InsightsPanel` | AI insights display |
| `ProductPerformanceTable` | Product metrics table |
| `RepresentativeBadges` | Achievement badges |

### Customer Components (`src/components/customer/`)

| Component | Purpose |
|-----------|---------|
| `AICustomerSummary` | AI-generated customer insights |
| `PrincipalityScoreModal` | Detailed score breakdown |
| `AutoPilotPanel` | Workflow automation panel |
| `PrimaryBankPanel` | Customer share of wallet |
| `CreateCustomerModal` | AI customer generation |

### Action Components (`src/components/actions/`)

| Component | Purpose |
|-----------|---------|
| `ActionPlanningModal` | Full action lifecycle management |
| `AddActionModal` | Quick action creation |

### AI Components (`src/components/ai/`)

| Component | Purpose |
|-----------|---------|
| `PlanMyDayDisplay` | AI plan visualization with save buttons |

### Settings Components (`src/components/settings/`)

| Component | Purpose |
|-----------|---------|
| `AIProviderSettings` | AI provider configuration |
| `ElevenLabsSettings` | Voice settings management |
| `QueryPanel` | SQL query interface |

---

## 8. Internationalization

### Supported Languages
- **Turkish (tr)**: Primary language
- **English (en)**: Full translation
- **Spanish (es)**: Full translation

### Translation System
- **File**: `src/i18n/translations.ts`
- **Context**: `src/contexts/LanguageContext.tsx`
- **Component**: `src/components/LanguageSelector.tsx`

### Key Translation Namespaces
- `nav`: Navigation labels
- `dashboard`: Dashboard content
- `customers`: Customer page content
- `actions`: Action management
- `primaryBank`: Primary bank analytics
- `settings`: Settings and preferences
- `statusLabels`: Action status translations
- `customerStatusLabels`: Customer status translations
- `sectorLabels`: Sector name translations
- `segmentLabels`: Segment name translations

---

## 9. Authentication & Authorization

### Authentication Flow
1. User navigates to any protected route
2. `ProtectedRoute` component checks auth state
3. Unauthenticated users redirected to `/auth`
4. `AuthContext` manages session state
5. `useSessionValidator` handles token refresh

### Row Level Security (RLS)
- All data tables have RLS policies
- Users only access their own portfolio data
- Admin role bypasses certain restrictions
- `portfolio_manager_id` used for data isolation

### Role-Based Access
- **User Role**: Standard portfolio manager access
- **Admin Role**: Additional access to:
  - Threshold editing
  - SQL query execution
  - System configuration

---

## 10. Deployment

### Docker Configuration
- **Dockerfile**: Multi-stage build with Nginx
- **nginx.conf**: SPA routing configuration
- **cloudbuild.yaml**: Google Cloud Build pipeline

### Environment Variables
```env
VITE_SUPABASE_URL=<supabase_url>
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_SUPABASE_PROJECT_ID=<project_id>
```

### Cloud Secrets (Edge Functions)
- AI provider API keys (optional, Lovable AI is default)
- ElevenLabs API key (for voice features)

---

## 11. Demo Mode

### Features
- Multi-language audio narration (ElevenLabs)
- Visual spotlight and focus system
- Automated UI interactions
- Step-by-step guided tour
- Playback controls (play/pause/skip)

### Files
- `src/demo/contexts/DemoContext.tsx`: State management
- `src/demo/hooks/useDemoAudio.ts`: Audio playback
- `src/demo/hooks/useDemoActions.ts`: UI automation
- `src/demo/scripts/dashboard.ts`: Demo script definition

---

## 12. Domain Concepts

### Customer Status Progression
```
Yeni Müşteri → Aktif → Target → Strong Target → Ana Banka
```

### Product Categories
- Kredi (Loans)
- Kaynak (Deposits)
- Ödeme (Payments)
- Tahsilat (Collections)
- Sigorta (Insurance)
- İştirak (Affiliates)

### Customer Segments
- MİKRO: Micro businesses
- Kİ: Small businesses
- OBİ: SME segment
- TİCARİ: Commercial/Corporate

### Customer Sectors
- Turizm (Tourism)
- Ulaşım (Transportation)
- Perakende (Retail)
- Gayrimenkul (Real Estate)
- Tarım Hayvancılık (Agriculture)
- Sağlık (Healthcare)
- Enerji (Energy)

### Action Status Flow
```
Beklemede (Pending) → Planlandı (Planned) → Tamamlandı (Completed)
                                         ↘ Ertelendi (Postponed)
                                         ↘ İlgilenmiyor (Not Interested)
                                         ↘ Uygun Değil (Not Suitable)
```

### Action Types
- `model_based`: AI-generated recommendations
- `ad_hoc`: Manually created by users
- `rm_action`: Relationship manager specific
- `recursive`: Recurring actions

### Action Priority
- `high`: Urgent, high-value opportunities
- `medium`: Standard priority
- `low`: Lower urgency items

---

## 13. AI Integration

### Supported Providers
1. **Lovable AI Gateway** (Default - No API key required)
   - openai/gpt-5-mini (default)
   - openai/gpt-5
   - google/gemini-2.5-flash
   - google/gemini-2.5-pro
2. **OpenAI Direct**
3. **OpenRouter**
4. **Local OpenAI-compatible** (custom base URL)

### AI Features
- Portfolio insights generation
- Action recommendations
- Customer prioritization
- Daily planning assistance
- Primary bank data generation
- Demo audio narration

---

## 14. Security Considerations

### Enterprise Deployment Notes
- All API keys stored in Supabase secrets (not in code)
- Business strategy templates remain internal
- Action templates are company-proprietary
- RLS ensures data isolation between users
- Session tokens refreshed proactively

---

## Document Metadata

- **Last Updated**: 2026-01-15
- **Version**: 2.0
- **Technology Stack**: React 18 + TypeScript + Vite + Supabase + TailwindCSS + shadcn/ui
- **Data Storage**: Supabase PostgreSQL with RLS
- **Target Domain**: Turkish Corporate Banking
- **Deployment**: Docker + Google Cloud Run

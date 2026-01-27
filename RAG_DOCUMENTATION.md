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

### Product Performance (/product-performance)

**Business Purpose:** Shows portfolio-level product metrics and target achievement analysis. Products are categorized by status (On Track, At Risk, Critical) with sub-statuses.

**Product Status Definitions:**

| Status | Definition |
|--------|------------|
| On Track | Overall average HGO >= 80% |
| At Risk | Overall average HGO >= 50% but < 80% |
| Critical | Overall average HGO < 50% |
| Melting | Stock metrics good (>=80%) but flow metrics low (<80%) - losing momentum |
| Growing | Flow metrics good (>=80%) but stock metrics low (<80%) - building up |
| Ticket Size | Customer count good but volume low - small transactions |
| Diversity | Volume good but customer count low - few large customers |

**Status Calculation Logic:**
```
If stockAvg >= 80 && flowAvg < 80: 'melting'
If stockAvg < 80 && flowAvg >= 80: 'growing'
If countAvg >= 80 && volumeAvg < 80: 'ticket_size'
If countAvg < 80 && volumeAvg >= 80: 'diversity'
Otherwise: use overall average thresholds (GOOD=80, BAD=50)
```

**Table Columns:** Product Name, Category, Stock Count, Stock Volume, Stock HGO%, Stock YoY%, Stock MoM%, Flow Count, Flow Volume, Flow HGO%, Flow YoY%, Flow MoM%, Status

**Technical Files:** `src/pages/ProductPerformance.tsx`, `src/components/dashboard/ProductPerformanceTable.tsx`

---

### Customer Journey (/customer-journey)

**Business Purpose:** Visual customer progression roadmap showing how customers move through relationship stages from new customer to primary bank status.

**Journey Stages:**

| Stage | Turkish | Description |
|-------|---------|-------------|
| New Customer | Yeni Musteri | Recently acquired customers |
| Active | Aktif | Customers with regular transactions |
| Target | Target | Customers with growth potential |
| Strong Target | Strong Target | High-value customers close to primary bank |
| Primary Bank | Ana Banka | Customers where we are the main banking partner |

**Progression:** Yeni Musteri -> Aktif -> Target -> Strong Target -> Ana Banka

**Technical Files:** `src/pages/CustomerJourney.tsx`

---

### Primary Bank (/primary-bank)

**Business Purpose:** Share of wallet analysis and competitive positioning dashboard. Shows overall principality score and breaks it down into external data (from market sources) and internal product metrics.

**Principality Score Formula:**
```
overallScore = loanShare * 0.4 + posShare * 0.3 + chequeShare * 0.2 + collateralShare * 0.1
```

**Weights:**
- Loan Share: 40% (most important)
- POS Share: 30%
- Cheque Share: 20%
- Collateral Share: 10%

**External Data Metrics:**
- **Loans Share** - Bank's share of customer total loans (cash + non-cash)
- **POS Share** - Point-of-sale transaction volume share
- **Cheque Share** - Percentage of customers with cheque activity at our bank
- **Collateral Share** - Collateral registration share

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

**Business Purpose:** Customer portfolio management with search, filtering, and navigation to individual customer details.

**Filters:**
- Search (customer names, action names, group names)
- Status (Yeni Musteri, Aktif, Target, Strong Target, Ana Banka)
- Product (filter by product ownership)
- Group (customer group/holding company)
- Action Status (Beklemede, Planlandy)

**URL Parameters:** `?status=`, `?product=`, `?group=`

**Technical Files:** `src/pages/Customers.tsx`

---

### Customer Detail (/customers/:customerId)

**Business Purpose:** Comprehensive single-customer view with four view modes.

**View Modes:**

1. **Primary Bank** - Customer-specific share of wallet analysis with principality score breakdown
2. **Products** - All customer products with current value, threshold comparison, gap analysis
3. **Actions** - All customer actions with management capabilities
4. **Autopilot** - Pre-configured workflow templates

**Technical Files:** `src/pages/CustomerDetail.tsx`, `src/components/customer/PrimaryBankPanel.tsx`, `src/components/customer/AutoPilotPanel.tsx`

---

### Actions Agenda (/agenda)

**Business Purpose:** Calendar-based action planning and management with multiple view modes.

**View Modes:** Daily, Weekly, Monthly, List

**Filters:** Status (Planlandy, Beklemede), Priority (high, medium, low), Search

**URL Parameters:** `?status=Planlandy` or `?status=Beklemede`

**Technical Files:** `src/pages/ActionsAgenda.tsx`

---

### AI Assistant (/ai-assistant)

**Business Purpose:** Conversational AI interface for portfolio intelligence with Plan My Day feature.

**Features:**
- Multiple conversation threads
- Plan My Day with automatic customer prioritization
- Save actions from AI suggestions
- Token usage tracking

**URL Trigger:** `?prompt=plan-my-day&date=YYYY-MM-DD`

**Technical Files:** `src/pages/AIAssistant.tsx`, `supabase/functions/ai-action-assistant/index.ts`

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

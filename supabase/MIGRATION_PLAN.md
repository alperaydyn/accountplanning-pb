# Supabase Database Migration Plan

## Overview
This document outlines the step-by-step plan to migrate the Account Planning System from mock data to a persistent Supabase database.

---

## Phase 1: Database Schema Design

### 1.1 Core Tables

#### `portfolio_managers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| user_id | uuid | FK to auth.users, UNIQUE | Links to auth user |
| name | text | NOT NULL | Full name |
| email | text | NOT NULL, UNIQUE | Email address |
| portfolio_name | text | NOT NULL | Name of portfolio |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

#### `customer_groups`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Group name |
| portfolio_manager_id | uuid | FK to portfolio_managers | Owner of group |
| created_at | timestamptz | default now() | Creation timestamp |

#### `customers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Customer name |
| sector | text | NOT NULL | Agriculture, Manufacturing, etc. |
| segment | text | NOT NULL | Small, Medium, Large Enterprise |
| status | text | NOT NULL | inactive, active, target, strong_target, primary |
| principality_score | integer | CHECK (0-100) | Score 0-100 |
| last_activity_date | date | | Last activity |
| portfolio_manager_id | uuid | FK to portfolio_managers, NOT NULL | Assigned manager |
| group_id | uuid | FK to customer_groups, NULLABLE | Optional group |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

#### `products`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Product name |
| category | text | NOT NULL | loans, deposits, fx, cards, etc. |
| is_external | boolean | default false | External product flag |
| description | text | | Product description |
| created_at | timestamptz | default now() | Creation timestamp |

#### `customer_products`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| customer_id | uuid | FK to customers, NOT NULL | Customer reference |
| product_id | uuid | FK to products, NOT NULL | Product reference |
| current_value | numeric | default 0 | Current value |
| threshold | numeric | default 0 | Target threshold |
| external_data | numeric | NULLABLE | External data value |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

**Note:** `gap` and `actionsCount` are computed fields, not stored.

#### `actions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| customer_id | uuid | FK to customers, NOT NULL | Customer reference |
| product_id | uuid | FK to products, NOT NULL | Product reference |
| name | text | NOT NULL | Action name |
| description | text | | Action description |
| type | text | NOT NULL | model_based, ad_hoc |
| priority | text | NOT NULL | high, medium, low |
| status | text | NOT NULL | pending, planned, completed, postponed, not_interested, not_possible |
| target_value | numeric | NULLABLE | Target value |
| planned_date | date | NULLABLE | Planned date |
| completed_date | date | NULLABLE | Completion date |
| explanation | text | NULLABLE | Explanation text |
| time_to_ready | integer | default 0 | Days to ready |
| action_response | text | NULLABLE | Customer response |
| estimated_action_time | integer | NULLABLE | Estimated days |
| created_at | timestamptz | default now() | Creation timestamp |
| updated_at | timestamptz | default now() | Last update timestamp |

### 1.2 Autopilot Tables (Optional - Phase 2)

#### `autopilot_products`
#### `autopilot_instances`
#### `autopilot_steps`

---

## Phase 2: Row Level Security (RLS)

### 2.1 RLS Policies

All tables will have RLS enabled with the following policies:

1. **portfolio_managers**: Users can only read/update their own profile
2. **customer_groups**: Users can CRUD groups they own
3. **customers**: Users can CRUD customers in their portfolio
4. **products**: Read-only for all authenticated users (shared catalog)
5. **customer_products**: Users can CRUD for their customers only
6. **actions**: Users can CRUD for their customers only

---

## Phase 3: Database Functions & Triggers

### 3.1 Functions
- `update_updated_at_column()` - Auto-update timestamps
- `calculate_customer_actions_count()` - Compute action counts
- `handle_new_user()` - Create portfolio_manager on signup

### 3.2 Triggers
- `update_*_updated_at` - On all tables with updated_at
- `on_auth_user_created` - Create portfolio manager profile

---

## Phase 4: Code Migration

### 4.1 Create Data Layer
- [ ] Create `src/hooks/useCustomers.ts` - TanStack Query hooks
- [ ] Create `src/hooks/useProducts.ts`
- [ ] Create `src/hooks/useActions.ts`
- [ ] Create `src/hooks/useCustomerProducts.ts`
- [ ] Create `src/hooks/usePortfolio.ts`

### 4.2 Update Components
- [ ] Update `src/pages/Customers.tsx` - Use hooks instead of mock data
- [ ] Update `src/pages/CustomerDetail.tsx`
- [ ] Update `src/pages/Dashboard.tsx`
- [ ] Update `src/pages/ActionsAgenda.tsx`
- [ ] Update all dashboard components

### 4.3 Add Authentication
- [ ] Create `src/pages/Auth.tsx` - Login/Signup page
- [ ] Create `src/contexts/AuthContext.tsx` - Auth state management
- [ ] Add route protection

---

## Phase 5: Data Seeding

### 5.1 Products (Static Data)
Products are a shared catalog - seed once during migration.

### 5.2 Sample Data (Optional)
For testing, create seed script for sample:
- Portfolio managers
- Customer groups
- Customers
- Customer products
- Actions

---

## Phase 6: Testing & Validation

- [ ] Test all CRUD operations
- [ ] Verify RLS policies
- [ ] Test computed fields (gap, action counts)
- [ ] Performance testing with real data volumes
- [ ] Auth flow testing

---

## Migration Order

1. **Run migrations** (schema + RLS + functions)
2. **Seed products table** (shared catalog)
3. **Implement auth** (login/signup)
4. **Create data hooks**
5. **Update components one by one**
6. **Remove mock data files**

---

## Questions for Adjustment

Before proceeding, please confirm or adjust:

1. **Sectors**: Are these the correct options?
   - Agriculture, Manufacturing, Services, Technology, Healthcare, Retail, Energy

2. **Segments**: Are these correct?
   - Small, Medium, Large Enterprise

3. **Customer Statuses**: Are these correct?
   - inactive, active, target, strong_target, primary

4. **Product Categories**: Are these correct?
   - loans, deposits, fx, cards, insurance, investment, payment, external

5. **Action Statuses**: Are these correct?
   - pending, planned, completed, postponed, not_interested, not_possible

6. **Multi-user support**: Should different portfolio managers see their own data only?

7. **Products**: Is the product catalog shared across all users, or per-portfolio?

8. **Autopilot feature**: Should we include autopilot tables in Phase 1?

9. **Any additional fields needed on any table?**

10. **Any computed fields that should be stored vs calculated?**

---

## Files to Delete After Migration

Once fully migrated, these mock data files can be removed:
- `src/data/customers.ts`
- `src/data/products.ts`
- `src/data/actions.ts`
- `src/data/customerProducts.ts`
- `src/data/portfolio.ts`
- `src/data/autopilot.ts`
- `src/data/actionRequirements.ts`

---

**Status**: ⏳ Awaiting user review and adjustments

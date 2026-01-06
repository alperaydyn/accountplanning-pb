# Account Planning System - Technical Documentation

## 1. Project Overview

The Account Planning System is a corporate banking relationship management application designed for portfolio managers to optimize customer relationships and maximize revenue opportunities. The system solves the critical business problem of efficiently managing and growing corporate banking portfolios by providing data-driven insights, automated action recommendations, and streamlined customer engagement workflows. It enables portfolio managers to identify cross-selling opportunities, track product penetration, monitor customer engagement, and prioritize relationship-building activities based on AI-driven recommendations.

### Main User Roles & Goals

- **Portfolio Manager (Relationship Manager)**: The primary user who manages a portfolio of corporate banking customers
  - **Goals**: Maximize primary bank status across portfolio, identify and execute revenue-generating actions, track product penetration per customer, monitor customer principality scores, plan and execute sales activities

- **Corporate Banking Customer**: Indirectly represented in the system
  - **Goals**: Receive relevant product offerings, manage banking relationships, access suitable financial products

---

## 2. Domain Concepts & Glossary

### Portfolio

**Definition**: A collection of corporate customers assigned to a specific Portfolio Manager, representing their responsibility area in corporate banking.

**Code Location**: `src/data/portfolio.ts`

**Business Rules**:

- Each portfolio is managed by exactly one Portfolio Manager
- Portfolio performance is measured by metrics like Primary Bank Score, action completion rates, and customer counts
- Portfolio summary includes YoY (Year-over-Year) and MoM (Month-over-Month) performance comparisons

---

### Customer

**Definition**: A corporate banking client (typically a business entity or holding company) that maintains banking relationships and uses financial products.

**Code Location**:

- Type definition: `src/types/index.ts` (`Customer` interface)
- Mock data: `src/data/customers.ts`
- UI: `src/pages/Customers.tsx`, `src/pages/CustomerDetail.tsx`

**Business Rules**:

- Each customer belongs to exactly one Portfolio Manager
- Customers have a status indicating relationship strength: `inactive`, `active`, `target`, `strong_target`, or `primary`
- Customers are categorized by Sector (e.g., Agriculture, Manufacturing, Technology) and Segment (Small, Medium, Large Enterprise)
- Each customer has a **Principality Score** (0-100) measuring how much the bank is their "primary" banking relationship
- Customers may belong to a **Customer Group** (e.g., holding companies with multiple subsidiaries)
- Customer status typically progresses from inactive → active → target → strong_target → primary as the relationship deepens

---

### Customer Group

**Definition**: A logical grouping of related customers, typically representing a holding company structure where multiple business entities are related.

**Code Location**: `src/data/customers.ts` (`customerGroups` array)

**Business Rules**:

- A customer group contains multiple customers
- Group membership is optional (not all customers belong to a group)
- Used to understand consolidated banking needs and cross-selling opportunities within conglomerates

---

### Principality Score

**Definition**: A numeric metric (0-100) measuring how "primary" the bank is to a customer, based on the customer's total banking relationship concentration with this bank versus competitors.

**Code Location**:

- Type definition: `src/types/index.ts` (field in `Customer` interface)
- UI component: `src/components/customer/PrincipalityScoreModal.tsx`

**Business Rules**:

- Higher scores (closer to 100) indicate the customer considers the bank their primary banking partner
- Score influences prioritization of relationship management activities
- Improving principality score is a key KPI for Portfolio Managers

---

### Product

**Definition**: A banking product or service that can be sold to customers, such as loans, deposits, FX services, cards, insurance, or payment solutions.

**Code Location**:

- Type definition: `src/types/index.ts` (`Product` interface)
- Mock data: `src/data/products.ts`

**Business Rules**:

- Products are categorized by type: `loans`, `deposits`, `fx`, `cards`, `insurance`, `investment`, `payment`, or `external`
- Products can be either **internal** (offered by this bank) or **external** (products the customer has with competitors)
- External products represent competitive intelligence and cross-selling opportunities

---

### Customer Product (Product Holding)

**Definition**: An instance of a customer holding or using a specific banking product, tracking current value, thresholds, and gap analysis.

**Code Location**:

- Type definition: `src/types/index.ts` (`CustomerProduct` interface)
- Mock data: `src/data/customerProducts.ts`

**Business Rules**:

- Each customer-product relationship has:
  - **Current Value**: Current balance/volume/usage of the product
  - **Threshold**: Target or benchmark value for the product (derived from Product Thresholds based on customer's sector/segment)
  - **Gap**: Calculated as `threshold - currentValue`, representing growth opportunity
  - **Actions Count**: Number of planned actions related to this product for this customer
- For **external products**, the `externalData` field tracks competitive product holdings
- A negative gap indicates the customer exceeds the threshold (over-performing)

---

### Product Threshold

**Definition**: A target or benchmark value for a specific product, varying by customer sector and segment. These values are used to calculate gaps and identify growth opportunities.

**Code Location**:

- Database table: `product_thresholds`
- Hook: `src/hooks/useProductThresholds.ts`
- UI: `src/pages/Thresholds.tsx`

**Business Rules**:

- Thresholds are defined per **sector/segment/product** combination (e.g., "Tourism + Large Enterprise + TL Cash Loan = 75M TL")
- Values are **externally calculated** by business analysts based on:
  - Market benchmarks
  - Sector-specific characteristics
  - Segment size expectations
- Each threshold record includes:
  - **Threshold Value**: Target amount/volume
  - **Calculation Date**: When the threshold was determined
  - **Version Number**: For tracking historical changes
  - **Active/Inactive Status**: Only active thresholds are used in calculations
- Thresholds can be:
  - Uploaded via CSV for bulk updates
  - Edited individually through the UI
  - Deactivated (not deleted) to preserve history
- **Future Enhancement**: Automatic threshold calculation based on market data and AI models

---

### Action

**Definition**: A specific sales or relationship-building activity that a Portfolio Manager plans or executes with a customer, typically targeted at a specific product.

**Code Location**:

- Type definition: `src/types/index.ts` (`Action` interface)
- Mock data: `src/data/actions.ts`
- UI: `src/pages/ActionsAgenda.tsx`, `src/pages/CustomerDetail.tsx`
- Modal: `src/components/actions/ActionPlanningModal.tsx`

**Business Rules**:

- Each action has:
  - **Type**: `model_based` (AI/system-recommended) or `ad_hoc` (manually created by Line of Business users)
  - **Priority**: `high`, `medium`, or `low` - dynamically calculated by an orchestrator model for each customer based on the potential value of the action
  - **Status**: `pending`, `planned`, `completed`, `postponed`, `not_interested`, or `not_possible`
  - **Target Value**: Expected revenue or product value from the action
  - **Time to Ready**: Estimated days until the customer is ready for this action
  - **Estimated Action Time** (optional): Expected duration to complete the action
- Actions progress through a lifecycle:
  - `pending`: Identified but not yet scheduled
  - `planned`: Scheduled with a planned date
  - `completed`: Successfully executed
  - `postponed`: Delayed to a future date
  - `not_interested`: Customer declined the offer
  - `not_possible`: Action cannot be executed (e.g., compliance/credit issues)
- Actions may have **action responses** capturing customer feedback

---

### Action Requirements

**Definition**: Structured data fields required to properly plan and execute a specific type of action (e.g., credit limit increase requires current limit, requested limit, credit score, etc.).

**Code Location**: `src/data/actionRequirements.ts`

**Business Rules**:

- Different action types have different required fields
- Field types include: `text`, `number`, `currency`, `date`, `select`
- Used to ensure Portfolio Managers gather necessary information before executing an action
- **Action requirements for each action type are provided by Subject Matter Experts (SMEs)**

---

### Product Performance

**Definition**: Aggregated metrics tracking how well a product is performing across the portfolio in terms of customer count, volume, and growth.

**Code Location**:

- Type definition: `src/types/index.ts` (`ProductPerformance`, `ProductPerformanceRow` interfaces)
- Data generation: `src/data/portfolio.ts`
- UI: `src/components/dashboard/ProductPerformanceTable.tsx`

**Business Rules**:

- Performance is tracked in two dimensions:
  - **Stock**: Cumulative/existing product holdings (point-in-time snapshot)
  - **Flow**: New product acquisitions or changes over a period (incremental)
- Each dimension tracks:
  - Count (number of customers with the product)
  - Volume (total value/balance across all customers)
  - Target % (performance versus target)
  - YoY % (year-over-year growth)
  - MoM % (month-over-month growth)
- Overall product status: `on_track`, `at_risk`, or `critical`

---

### Autopilot Product

**Definition**: A pre-defined, partially automated workflow for executing common banking processes (e.g., loan issuance, card application) with both automatic steps and human intervention points.

**Code Location**:

- Type definitions: `src/data/autopilot.ts` (`AutopilotProduct`, `AutopilotStep`, `AutopilotInstance` interfaces)
- UI: `src/components/customer/AutoPilotPanel.tsx`

**Business Rules**:

- Autopilot products define a sequence of **steps**, each labeled as `automatic` (system-executed) or `human` (requires manual intervention)
- Portfolio Managers can initiate autopilot instances for customers by providing required inputs
- Each instance tracks step completion status: `pending`, `in_progress`, or `complete`
- Instance overall status: `active`, `completed`, or `cancelled`
- Examples: Installment Loan, Credit Card Issuance, Term Deposit Opening, Trade Finance LC
- **Each automatic action step is mapped to a core banking system service or EVAM (Event-Driven Architecture) listener to trigger the automated process**

---

## 3. Data Model

> **Note**: This application currently uses **in-memory mock data** stored in TypeScript files within `src/data/`. There is no persistent database, ORM models, or SQL migrations in the codebase. The data model described below represents the **logical/conceptual schema** inferred from TypeScript interfaces and mock data structures.

---

### Entity: PortfolioManager

**Description**: Represents a bank employee managing a portfolio of customers.

| Field           | Type   | Constraints          | Description                                                              |
| --------------- | ------ | -------------------- | ------------------------------------------------------------------------ |
| `id`            | string | PK, unique, not null | Internal identifier for the portfolio manager                            |
| `name`          | string | not null             | Full name of the portfolio manager                                       |
| `email`         | string | not null, unique     | Email address                                                            |
| `portfolioName` | string | not null             | Descriptive name of the portfolio (e.g., "Corporate Banking - Region 1") |
| `customerCount` | number | not null             | Total number of customers in the portfolio (derived/calculated field)    |

**Notes**:

- Currently only one Portfolio Manager is represented in the system (`currentUser`)
- In a production system, this would be a multi-user system with authentication

---

### Entity: CustomerGroup

**Description**: Logical grouping for related customers (e.g., holding company subsidiaries).

| Field  | Type   | Constraints          | Description                                     |
| ------ | ------ | -------------------- | ----------------------------------------------- |
| `id`   | string | PK, unique, not null | Internal identifier for the customer group      |
| `name` | string | not null             | Display name of the group (e.g., "Koç Holding") |

**Notes**:

- Static list in mock data
- Represents well-known corporate groups in Turkey

---

### Entity: Customer

**Description**: Corporate banking client tracked in the portfolio.

| Field                    | Type              | Constraints                        | Description                                                                                                 |
| ------------------------ | ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`                     | string            | PK, unique, not null               | Internal identifier for the customer                                                                        |
| `name`                   | string            | not null                           | Company/customer name                                                                                       |
| `sector`                 | enum              | not null                           | Industry sector: `Agriculture`, `Manufacturing`, `Services`, `Technology`, `Healthcare`, `Retail`, `Energy` |
| `segment`                | enum              | not null                           | Business size: `Small`, `Medium`, `Large Enterprise`                                                        |
| `status`                 | enum              | not null                           | Relationship status: `inactive`, `active`, `target`, `strong_target`, `primary`                             |
| `principalityScore`      | number            | not null, range 0-100              | Measure of bank's primary relationship status with customer                                                 |
| `lastActivityDate`       | string (ISO date) | not null                           | Most recent engagement or transaction date                                                                  |
| `portfolioManagerId`     | string            | FK → PortfolioManager.id, not null | The Portfolio Manager responsible for this customer                                                         |
| `totalActionsPlanned`    | number            | not null                           | Count of planned/scheduled actions for this customer (derived)                                              |
| `totalActionsNotPlanned` | number            | not null                           | Count of pending (not yet planned) actions (derived)                                                        |
| `groupId`                | string            | FK → CustomerGroup.id, nullable    | Customer group association (optional)                                                                       |

**Notes**:

- `totalActionsPlanned` and `totalActionsNotPlanned` are calculated fields aggregated from the Action entity
- `status` represents the progression of relationship quality

---

### Entity: Product

**Description**: Banking product or service available to customers.

| Field         | Type    | Constraints          | Description                                                                                        |
| ------------- | ------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `id`          | string  | PK, unique, not null | Internal identifier for the product                                                                |
| `name`        | string  | not null             | Product display name (e.g., "Cash Loan", "Corporate Card")                                         |
| `category`    | enum    | not null             | Product type: `loans`, `deposits`, `fx`, `cards`, `insurance`, `investment`, `payment`, `external` |
| `isExternal`  | boolean | not null             | `true` if this is a competitor's product (for tracking external holdings), `false` if internal     |
| `description` | string  | not null             | Descriptive text explaining the product                                                            |

**Notes**:

- External products (where `isExternal = true`) are used to track competitive intelligence
- Product list appears to be managed centrally (static in code)

---

### Entity: CustomerProduct

**Description**: Junction/relationship entity tracking a customer's usage of a specific product.

| Field          | Type   | Constraints                | Description                                                               |
| -------------- | ------ | -------------------------- | ------------------------------------------------------------------------- |
| `id`           | string | PK, unique, not null       | Internal identifier                                                       |
| `customerId`   | string | FK → Customer.id, not null | The customer who holds/uses this product                                  |
| `productId`    | string | FK → Product.id, not null  | The product being used                                                    |
| `currentValue` | number | not null                   | Current balance/volume/value of product holding for this customer         |
| `threshold`    | number | not null                   | Target or expected level set for this product (business goal)             |
| `gap`          | number | not null                   | Calculated as `threshold - currentValue`, representing opportunity size   |
| `externalData` | number | nullable                   | If product is external, the value of holdings at competitor banks         |
| `actionsCount` | number | not null                   | Number of actions planned for this customer-product combination (derived) |

**Notes**:

- Unique constraint likely on `(customerId, productId)` in a real system
- `gap` is calculated, not stored separately in a real system
- `externalData` only populated when `Product.isExternal = true`

---

### Entity: Action

**Description**: Specific sales or relationship activity planned or executed by Portfolio Manager.

| Field                 | Type              | Constraints                | Description                                                                                        |
| --------------------- | ----------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                  | string            | PK, unique, not null       | Internal identifier                                                                                |
| `customerId`          | string            | FK → Customer.id, not null | The customer targeted by this action                                                               |
| `productId`           | string            | FK → Product.id, not null  | The product related to this action                                                                 |
| `name`                | string            | not null                   | Action name/title (e.g., "Increase credit limit", "Cross-sell deposit product")                    |
| `description`         | string            | not null                   | Detailed explanation of the action rationale                                                       |
| `type`                | enum              | not null                   | Source of action: `model_based` (AI-generated) or `ad_hoc` (manually created)                      |
| `priority`            | enum              | not null                   | Urgency level: `high`, `medium`, `low`                                                             |
| `status`              | enum              | not null                   | Lifecycle status: `pending`, `planned`, `completed`, `postponed`, `not_interested`, `not_possible` |
| `targetValue`         | number            | nullable                   | Expected revenue or product value outcome from this action                                         |
| `plannedDate`         | string (ISO date) | nullable                   | When the action is scheduled (only populated when status = `planned`)                              |
| `completedDate`       | string (ISO date) | nullable                   | When the action was completed (only populated when status = `completed`)                           |
| `explanation`         | string            | nullable                   | Model or business explanation for why this action was recommended                                  |
| `timeToReady`         | number            | not null                   | Estimated days until customer is ready for this action                                             |
| `createdAt`           | string (ISO date) | not null                   | When this action was created/identified                                                            |
| `actionResponse`      | string            | nullable                   | Customer feedback or response to the action                                                        |
| `estimatedActionTime` | number            | nullable, optional         | Estimated days required to complete the action (optional field)                                    |

**Notes**:

- Actions are the primary workflow entities in the system
- Status transitions follow a lifecycle (pending → planned → completed/postponed/not_interested/not_possible)
- Actions with status `completed` should have `completedDate`; actions with status `planned` should have `plannedDate`
- All action status changes are logged in an audit table for compliance and tracking purposes
- Priority values are dynamically calculated by an orchestrator model based on customer context and action potential value

---

### Entity: AutopilotProduct

**Description**: Pre-configured workflow template for common banking processes.

| Field         | Type                       | Constraints          | Description                                                                  |
| ------------- | -------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `id`          | string                     | PK, unique, not null | Internal identifier                                                          |
| `name`        | string                     | not null             | Workflow name (e.g., "Installment Loan", "Credit Card Issuance")             |
| `description` | string                     | not null             | Explanation of what this workflow automates                                  |
| `category`    | string                     | not null             | Business domain (e.g., "lending", "cards", "deposits", "trade", "insurance") |
| `inputs`      | array[AutopilotInputField] | not null             | Configuration/input fields required to start this workflow                   |
| `steps`       | array[AutopilotStep]       | not null             | Sequential steps in the workflow                                             |

**Notes**:

- Not directly tied to a specific customer (template-level entity)
- Steps define the process flow

---

### Entity: AutopilotStep

**Description**: Individual step within an AutopilotProduct workflow.

| Field   | Type   | Constraints          | Description                                                                      |
| ------- | ------ | -------------------- | -------------------------------------------------------------------------------- |
| `id`    | string | PK, unique, not null | Internal identifier                                                              |
| `name`  | string | not null             | Step description (e.g., "Credit Assessment", "Document Upload")                  |
| `type`  | enum   | not null             | Execution mode: `automatic` (system-handled) or `human` (requires manual action) |
| `order` | number | not null             | Sequential position in workflow                                                  |

**Notes**:

- `order` determines execution sequence
- Belongs to a parent `AutopilotProduct`

---

### Entity: AutopilotInstance

**Description**: A runtime execution of an AutopilotProduct for a specific customer.

| Field                | Type                  | Constraints                        | Description                                                                    |
| -------------------- | --------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `id`                 | string                | PK, unique, not null               | Internal identifier                                                            |
| `autopilotProductId` | string                | FK → AutopilotProduct.id, not null | The workflow being executed                                                    |
| `customerId`         | string                | FK → Customer.id, not null         | The customer for whom this workflow is running                                 |
| `inputs`             | object                | not null                           | User-provided values for workflow input fields (key-value pairs)               |
| `createdAt`          | string (ISO datetime) | not null                           | When the workflow instance was started                                         |
| `status`             | enum                  | not null                           | Instance lifecycle: `active`, `completed`, `cancelled`                         |
| `stepStatuses`       | object                | not null                           | Map of step IDs to their current status: `pending`, `in_progress`, `completed` |

**Notes**:

- Tracks real-time workflow progress
- In-memory storage in current implementation (would be persisted in production)

---

### Entity: AutopilotInputField

**Description**: Input field definition for an AutopilotProduct (not a separate table, embedded in AutopilotProduct).

| Field         | Type          | Constraints      | Description                            |
| ------------- | ------------- | ---------------- | -------------------------------------- |
| `id`          | string        | unique, not null | Field identifier                       |
| `name`        | string        | not null         | Programmatic field name                |
| `label`       | string        | not null         | Human-readable label for UI            |
| `type`        | enum          | not null         | Input type: `number`, `text`, `select` |
| `placeholder` | string        | nullable         | Example value for UI                   |
| `options`     | array[string] | nullable         | Valid options if type = `select`       |
| `required`    | boolean       | not null         | Whether this field must be provided    |

**Notes**:

- Defines the schema for the `inputs` object in `AutopilotInstance`

---

### Entity: ActionAuditLog

**Description**: Audit trail table tracking all changes to action status for compliance and historical tracking.

| Field              | Type                  | Constraints                        | Description                                          |
| ------------------ | --------------------- | ---------------------------------- | ---------------------------------------------------- |
| `id`               | string                | PK, unique, not null               | Internal identifier for the audit record             |
| `actionId`         | string                | FK → Action.id, not null           | The action that was modified                         |
| `previousStatus`   | enum                  | nullable                           | Previous status value (null for creation)            |
| `newStatus`        | enum                  | not null                           | New status value after change                        |
| `changedBy`        | string                | FK → PortfolioManager.id, not null | User who made the status change                      |
| `changedAt`        | string (ISO datetime) | not null                           | Timestamp when the change occurred                   |
| `changeReason`     | string                | nullable                           | Optional explanation for the status change           |
| `customerResponse` | string                | nullable                           | Customer feedback captured during this status change |

**Notes**:

- Immutable records (insert-only, no updates or deletes)
- Provides complete audit trail for regulatory compliance
- Used for reporting, analytics, and performance tracking
- May also capture other action field changes beyond status in production

---

### Entity: ProductPerformance _(Derived/Calculated)_

**Description**: Aggregated performance metrics for a product across the entire portfolio. This is a **virtual entity** calculated on-demand, not stored.

| Field               | Type                  | Constraints               | Description                                         |
| ------------------- | --------------------- | ------------------------- | --------------------------------------------------- |
| `productId`         | string                | FK → Product.id, not null | The product being measured                          |
| `productName`       | string                | not null                  | Product display name                                |
| `category`          | enum                  | not null                  | Product category                                    |
| `stock`             | ProductPerformanceRow | not null                  | Metrics for existing/cumulative product holdings    |
| `flow`              | ProductPerformanceRow | not null                  | Metrics for new/incremental product activity        |
| `actionsPlanned`    | number                | not null                  | Count of planned actions related to this product    |
| `actionsNotPlanned` | number                | not null                  | Count of pending actions related to this product    |
| `status`            | enum                  | not null                  | Health indicator: `on_track`, `at_risk`, `critical` |

**Notes**:

- This entity is calculated by aggregating `CustomerProduct`, `Action`, and other data
- Used for dashboard reporting

---

### Entity: ProductPerformanceRow _(Nested/Embedded)_

**Description**: Metrics for either Stock or Flow dimension within ProductPerformance.

| Field                 | Type   | Constraints | Description                           |
| --------------------- | ------ | ----------- | ------------------------------------- |
| `count`               | number | not null    | Number of customers with this product |
| `targetPercent`       | number | not null    | Percentage of target achieved         |
| `yoy`                 | number | not null    | Year-over-year growth percentage      |
| `mom`                 | number | not null    | Month-over-month growth percentage    |
| `volume`              | number | not null    | Total value/balance across portfolio  |
| `volumeTargetPercent` | number | not null    | Volume as percentage of target        |
| `volumeYoy`           | number | not null    | Volume year-over-year growth %        |
| `volumeMom`           | number | not null    | Volume month-over-month growth %      |

**Notes**:

- Part of `ProductPerformance` entity, not a standalone table

---

### Entity: PortfolioSummary _(Derived/Calculated)_

**Description**: High-level KPIs for the entire portfolio. Virtual entity calculated on-demand.

| Field                   | Type   | Constraints | Description                                   |
| ----------------------- | ------ | ----------- | --------------------------------------------- |
| `totalCustomers`        | number | not null    | Total customer count                          |
| `primaryBankCustomers`  | number | not null    | Count of customers with `status = 'primary'`  |
| `nonPrimaryCustomers`   | number | not null    | Count of customers not in primary status      |
| `primaryBankScore`      | number | not null    | Percentage of customers with primary status   |
| `primaryBankScoreYoY`   | number | not null    | Year-over-year change in primary bank score   |
| `primaryBankScoreMoM`   | number | not null    | Month-over-month change in primary bank score |
| `totalActionsPlanned`   | number | not null    | Total planned actions across portfolio        |
| `totalActionsCompleted` | number | not null    | Total completed actions                       |
| `totalActionsPending`   | number | not null    | Total pending actions                         |

**Notes**:

- Calculated from `Customer` and `Action` entities
- Displayed on dashboard

---

## 3.1 Data Model Relationships

### Primary Relationships

- **PortfolioManager → Customer** (one-to-many)  
  Each Portfolio Manager is responsible for many Customers. Each Customer is assigned to exactly one Portfolio Manager.

- **Customer → CustomerGroup** (many-to-one, optional)  
  Many Customers may belong to a single Customer Group, but group membership is optional.

- **Customer → CustomerProduct** (one-to-many)  
  Each Customer can have many CustomerProduct holdings (junction with Product).

- **Product → CustomerProduct** (one-to-many)  
  Each Product can be held by many customers via CustomerProduct.

- **Customer → Action** (one-to-many)  
  Each Customer can have many Actions planned or executed for them.

- **Product → Action** (one-to-many)  
  Each Action is related to a specific Product.

- **AutopilotProduct → AutopilotInstance** (one-to-many)  
  Each AutopilotProduct template can have many runtime instances.

- **Customer → AutopilotInstance** (one-to-many)  
  Each AutopilotInstance is executed for a specific Customer.

- **AutopilotProduct → AutopilotStep** (one-to-many, composition)  
  Each AutopilotProduct contains multiple sequential AutopilotSteps.

- **AutopilotProduct → AutopilotInputField** (one-to-many, composition)  
  Each AutopilotProduct defines required AutopilotInputFields.

- **Action → ActionAuditLog** (one-to-many)  
  Each Action can have many audit log entries tracking status changes over time.

- **PortfolioManager → ActionAuditLog** (one-to-many)  
  Each audit log entry records which Portfolio Manager made the change.

### Cascading/Integrity Constraints (Inferred)

- Deleting a **Customer** should cascade delete (or orphan-handle) related `CustomerProduct`, `Action`, and `AutopilotInstance` records.
- Deleting a **Product** should handle related `CustomerProduct` and `Action` records (likely prevent deletion if in use).
- Deleting a **CustomerGroup** should set `Customer.groupId` to null.
- Deleting an **AutopilotProduct** should prevent if active `AutopilotInstance` records exist.
- **ActionAuditLog** records are immutable and should never be deleted (compliance requirement).

---

## 4. Behavioral Notes Around Data

### Action Lifecycle

**States**: `pending` → `planned` → `completed` | `postponed` | `not_interested` | `not_possible`

**Typical Flow**:

1. **Creation**: Actions are created either:
   - **Model-based**: AI/analytics engine identifies opportunity based on customer data, product gaps, and thresholds
   - **Ad-hoc**: Line of Business users manually create an action
2. **Pending**: Action is identified but not yet scheduled
3. **Priority Assignment**: Orchestrator model calculates dynamic priority score based on customer context and potential action value
4. **Planned**: Portfolio Manager schedules the action for a specific date (`plannedDate` is set)
5. **Execution**: Action is executed, resulting in one of:
   - `completed`: Success, `completedDate` is set
   - `postponed`: Customer requests delay
   - `not_interested`: Customer declines
   - `not_possible`: Cannot proceed (e.g., compliance, credit constraints)

### Customer Status Progression

Customers typically progress through statuses as the relationship deepens:

- `inactive` → Not currently engaged
- `active` → Basic relationship established
- `target` → Identified as growth opportunity
- `strong_target` → High-priority growth target
- `primary` → Bank is the customer's primary banking partner (highest value)

**Principality Score** aligns with this progression (higher scores = primary status).

### Data Loading & Cadence

**Current Implementation**:

- All data is **statically generated** in TypeScript files at application startup
- Mock data is created using randomization and predefined lists
- No external data feeds in current codebase

**Production System (Inferred Requirements)**:

- **Customer data**: Likely loaded from a CRM or core banking system on a **monthly or weekly** basis
- **Product holdings (CustomerProduct)**: Fetched from **data warehouse/data mart** containing customer balances and product relationships, possibly **monthly snapshots**
- **External product data**: Fed from **credit bureau** or competitive intelligence sources, likely **monthly or quarterly**
- **Principality Score**: Calculated externally based on share-of-wallet analysis, loaded **monthly**
- **Product Performance metrics**: Aggregated from transaction systems and data warehouse, updated **monthly** for Stock/Flow reporting
- **Actions**:
  - Model-based actions generated by analytics/ML engine on a **monthly or event-driven** basis
  - Ad-hoc actions created by users in real-time

### Enumeration Values & Business Meaning

#### ActionStatus

- `pending`: Identified by model or manager, not yet scheduled
- `planned`: Scheduled for execution, has a planned date
- `completed`: Successfully executed and closed
- `postponed`: Customer asked to delay, may be rescheduled
- `not_interested`: Customer declined the offer
- `not_possible`: Cannot proceed due to business constraints (credit, compliance, etc.)

#### CustomerStatus

- `inactive`: Dormant or minimal relationship
- `active`: Regular engagement, some product usage
- `target`: Identified as a prospect for deeper relationship
- `strong_target`: High-value prospect, prioritized for growth activities
- `primary`: Customer uses this bank as primary banking partner

#### Priority

- `high`: Critical or urgent action
- `medium`: Standard priority
- `low`: Nice-to-have, lower urgency

#### ActionType

- `model_based`: Recommended by AI/analytics model
- `ad_hoc`: Manually created by Line of Business users

#### ProductCategory

- `loans`: Lending products (cash loans, investment loans, trade finance, etc.)
- `deposits`: Deposit accounts (TL, FX, gold deposits)
- `fx`: Foreign exchange services (spot, forward, swap)
- `cards`: Credit/debit card products (corporate, fleet, purchasing cards)
- `insurance`: Insurance products (property, liability, health)
- `investment`: Investment products (mutual funds, bonds, equity)
- `payment`: Payment services (salary, SWIFT, EFT transfers)
- `external`: Competitor products tracked for intelligence

#### Sector

- `Agriculture`, `Manufacturing`, `Services`, `Technology`, `Healthcare`, `Retail`, `Energy`

#### Segment

- `Small`: Small business customers
- `Medium`: Mid-market corporate
- `Large Enterprise`: Large corporate/enterprise clients

---

## 5. Technical Mapping

### Customer

**Backend**:

- Type: `src/types/index.ts` → `Customer`
- Data: `src/data/customers.ts` → `customers` array, helper functions (`getCustomerById`, `getCustomersByFilter`)

**API/Endpoints**: None (client-side filtering only)

**UI**:

- Customer list page: `src/pages/Customers.tsx`
- Customer detail page: `src/pages/CustomerDetail.tsx`

**Jobs/Pipelines**: None (mock data, no batch processing)

---

### Customer Group

**Backend**:

- Type: `src/types/index.ts` → `CustomerGroup`
- Data: `src/data/customers.ts` → `customerGroups` array, `getGroupById`

**UI**: Referenced in customer detail view, group name displayed when applicable

---

### Product

**Backend**:

- Type: `src/types/index.ts` → `Product`
- Data: `src/data/products.ts` → `products` array, helper functions (`getProductById`, `getProductsByCategory`)

**UI**:

- Product performance table: `src/components/dashboard/ProductPerformanceTable.tsx`
- Customer detail → Product view: `src/pages/CustomerDetail.tsx`

---

### CustomerProduct

**Backend**:

- Type: `src/types/index.ts` → `CustomerProduct`
- Data: `src/data/customerProducts.ts` → `customerProducts` array, helpers (`getCustomerProducts`, `getCustomerProductByProductId`)

**UI**: Displayed in customer detail page product table, showing current value, threshold, gap, and action counts

---

### Action

**Backend**:

- Type: `src/types/index.ts` → `Action`
- Data: `src/data/actions.ts` → `actions` array, helpers (`getActionsByCustomerId`, `getActionsByProductId`, etc.)

**API/Endpoints**: None (client-side manipulation only)

**UI**:

- Actions agenda (calendar view): `src/pages/ActionsAgenda.tsx`
- Customer detail → Actions tab: `src/pages/CustomerDetail.tsx`
- Action planning modal: `src/components/actions/ActionPlanningModal.tsx`

**Jobs/Pipelines**:

- Mock generation creates model-based actions at startup
- Production: Would have an analytics/ML pipeline generating `model_based` actions periodically (e.g., monthly)
- **Orchestrator model** runs continuously to recalculate action priorities based on customer changes and action potential value

---

### Action Audit Log

**Backend**:

- Type: Not yet implemented (production requirement)
- Would be a database table with insert-only records

**API/Endpoints**:

- Would need endpoints for querying audit history
- Automatic logging triggered on any action status change

**UI**:

- Audit trail viewer (not yet implemented)
- Could show timeline of action changes in customer detail view

**Jobs/Pipelines**:

- Status change triggers would automatically insert audit records
- Compliance reporting jobs would query this table

---

### Portfolio & Portfolio Summary

**Backend**:

- Type: `src/types/index.ts` → `PortfolioManager`, `PortfolioSummary`
- Data: `src/data/portfolio.ts` → `currentUser`, `getPortfolioSummary()`

**UI**:

- Dashboard: `src/pages/Dashboard.tsx`
- Summary cards: `src/components/dashboard/SummaryCards.tsx`
- Representative badges: `src/components/dashboard/RepresentativeBadges.tsx`

---

### Product Performance

**Backend**:

- Type: `src/types/index.ts` → `ProductPerformance`, `ProductPerformanceRow`
- Data: `src/data/portfolio.ts` → `getProductPerformance()`

**UI**: `src/components/dashboard/ProductPerformanceTable.tsx`

---

### Autopilot

**Backend**:

- Types: `src/data/autopilot.ts` → `AutopilotProduct`, `AutopilotStep`, `AutopilotInstance`, `AutopilotInputField`
- Data: `src/data/autopilot.ts` → `autopilotProducts` array, runtime instance storage, helpers (`createAutopilotInstance`, `getAutopilotInstancesByCustomer`, etc.)

**UI**:

- Customer detail → Autopilot tab: `src/components/customer/AutoPilotPanel.tsx`

**Jobs/Pipelines**:

- Autopilot instances track workflow steps
- In production, **automatic steps are mapped to core banking system services or EVAM (Event-Driven Architecture) listeners** to trigger automated processes
- Human steps would generate tasks/notifications for staff

---

### Action Requirements

**Backend**: `src/data/actionRequirements.ts` → defines required fields per action type (requirements provided by Subject Matter Experts)

**UI**: Used by `src/components/actions/ActionPlanningModal.tsx` to render dynamic forms based on action type

---

### AI & Insights

**UI**:

- AI Customer Summary: `src/components/customer/AICustomerSummary.tsx` (mock AI-generated customer insights)
- Insights Panel: `src/components/dashboard/InsightsPanel.tsx` (portfolio-level AI recommendations)

**Backend**: Mock data only; production would integrate with LLM/analytics service

---

### Routing & Navigation

**Main Router**: `src/App.tsx`

**Routes**:

- `/` → Dashboard
- `/customers` → Customer list
- `/customers/:customerId` → Customer detail
- `/agenda` → Actions agenda (calendar view)

**Layout**:

- `src/components/layout/AppLayout.tsx` → Main layout wrapper
- `src/components/layout/AppHeader.tsx` → Top navigation
- `src/components/layout/AppSidebar.tsx` → Side navigation menu
- `src/components/layout/PageBreadcrumb.tsx` → Breadcrumb navigation

---

## 6. Assumptions & Open Questions

### Assumptions

1. **No Backend/Database**: The current codebase is a **frontend-only prototype** with in-memory mock data. All entities would require persistent storage and API endpoints in production.

2. **Single Portfolio Manager**: Only one user (`currentUser`) is represented. Multi-user support would require authentication, authorization, and user management.

3. **Generated Metrics**: All performance metrics (YoY, MoM, gaps, scores) are randomly generated. Production would require:
   - Historical data storage
   - Time-series analysis
   - Integration with data warehouse/business intelligence systems

4. **Static Product Catalog**: Products are hardcoded. Production may require dynamic product management, product versioning, and product configuration.

5. **No Workflow Engine**: Autopilot instances track status in-memory. Production requires orchestration/workflow engine (e.g., Temporal, Airflow, custom state machine) to execute automatic steps and route human tasks.

6. **Principality Score Calculation**: Score is randomly generated. Real implementation likely involves:
   - Credit bureau data integration
   - Share-of-wallet calculation (customer's total banking needs vs. holdings at this bank)
   - External competitive intelligence feeds

7. **Threshold Setting**: `CustomerProduct.threshold` values are randomly generated. In production:
   - Thresholds may be set by Portfolio Managers manually
   - Or calculated by analytics models based on customer segment, industry benchmarks, etc.

8. **Action Generation Model**: `model_based` actions are randomly generated. Production requires ML/analytics pipeline to:
   - Analyze customer transaction patterns
   - Identify product gaps and cross-sell opportunities
   - Score and prioritize recommended actions
   - Possibly real-time or monthly batch processing
   - **Orchestrator model** dynamically calculates priority scores based on customer context and action potential value

9. **Turkish Market Focus**: Customer names, sectors, and product names suggest this is designed for the **Turkish corporate banking market** (references to TL deposits, Turkish holding companies, etc.).

10. **Monthly Data Refresh Cadence**: Assumed based on typical corporate banking reporting cycles (Stock/Flow metrics, YoY/MoM comparisons suggest monthly snapshots).

11. **Audit Logging**: The frontend doesn't implement audit logging, but production requires **ActionAuditLog** table to track all status changes for compliance.

12. **EVAM Integration**: Autopilot automatic steps would integrate with core banking systems via **EVAM (Event-Driven Architecture) listeners** or direct service calls.

13. **Subject Matter Expert Role**: Action requirements for each action type are defined by **Subject Matter Experts (SMEs)**, not hardcoded by developers.

14. **Line of Business Users**: Ad-hoc actions can be created by **Line of Business users**, not limited to Portfolio Managers.

---

### Open Questions

1. **External Data Sources**:
   - What is the actual source system for customer and product data? (Core banking system, CRM, data warehouse?)
   - How is external product data (competitor holdings) obtained? Credit bureau, customer declarations, manual input?

2. **Principality Score**:
   - What is the exact formula or data source for Principality Score?
   - Is it calculated internally or provided by an external vendor?
   - How frequently is it updated?

3. **Thresholds**:
   - Who sets the `CustomerProduct.threshold` values? Portfolio Manager, analytics team, or automated model?
   - Are thresholds static or dynamic (e.g., adjusted quarterly)?

4. **Action Workflow**:
   - What happens when an action is marked `completed`? Is there a revenue tracking or deal closure process?
   - Are there approval workflows for high-value actions?
   - How do `postponed` actions get rescheduled?

5. **Autopilot Integration**:
   - What backend systems execute the "automatic" steps in autopilot workflows? (Core banking, loan origination system, card management system?)
   - How do human steps generate notifications or tasks for staff?

6. **Performance Metrics**:
   - Are Stock/Flow metrics standardized banking industry terms, or specific to this bank's reporting?
   - What defines "target" values for products? Individual goals per Portfolio Manager? Bank-wide targets?

7. **Customer Groups**:
   - How are customer group relationships maintained? Manually by Portfolio Managers, or fed from external master data?
   - Are there special business rules for managing groups (consolidated credit limits, group-level actions)?

8. **AI/ML Integration**:
   - What is the intended AI/ML stack for generating model-based actions and insights?
   - Is there a preference for cloud AI services (e.g., Azure ML, AWS SageMaker, Google Vertex AI) or on-premise solutions?

9. **Security & Compliance**:
   - What are the data privacy and security requirements? (Customer data classification, encryption, audit logging?)
   - Are there regulatory compliance requirements (e.g., GDPR, banking regulations)?

10. **Multi-Tenancy**:
    - Will this system be used by multiple banks/institutions (SaaS model) or single-tenant for one bank?

11. **Scalability**:
    - Expected data volumes? (Number of customers per Portfolio Manager, total customers in bank, number of products, actions per month?)

12. **Reporting & Analytics**:
    - Are there additional reporting requirements beyond the dashboard (e.g., export to Excel, scheduled reports, executive dashboards)?

13. **Integration Points**:
    - What other systems need to integrate with this application? (Email, calendar, CRM, marketing automation, document management?)

14. **Mobile Access**:
    - Is there a requirement for mobile access or a mobile app for Portfolio Managers?

15. **Orchestrator Model**:
    - What is the architecture of the orchestrator model that calculates priority scores?
    - How frequently does it recalculate priorities? Real-time, daily, or event-driven?
    - What factors does it consider beyond customer context and action potential value?

16. **EVAM Architecture**:
    - What is the detailed architecture of the EVAM (Event-Driven Architecture) system?
    - What message broker or event bus is used (e.g., Kafka, RabbitMQ, Azure Event Grid)?
    - How are automatic autopilot steps mapped to core banking services?

17. **Subject Matter Expert Process**:
    - How are action requirements gathered from SMEs and maintained in the system?
    - Is there a governance process for updating action requirements?
    - Who has authority to modify action types and their required fields?

18. **Line of Business Access**:
    - What Line of Business roles can create ad-hoc actions?
    - Are there approval workflows or limits on ad-hoc action creation?
    - How is access control managed across different business units?

---

## Document Metadata

- **Generated**: 2025-12-26
- **Source Repository**: `accountplanning-pb-main v3`
- **Technology Stack**: React + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Data Storage**: In-memory mock data (no database)
- **Target Domain**: Turkish Corporate Banking

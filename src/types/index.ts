// Core Types for Account Planning Application

export type Sector = 'Agriculture' | 'Manufacturing' | 'Services' | 'Technology' | 'Healthcare' | 'Retail' | 'Energy';
export type Segment = 'Small' | 'Medium' | 'Large Enterprise';
export type CustomerStatus = 'inactive' | 'active' | 'target' | 'strong_target' | 'primary';
export type ActionStatus = 'pending' | 'planned' | 'completed' | 'postponed' | 'not_interested' | 'not_possible';
export type ActionType = 'model_based' | 'ad_hoc';
export type Priority = 'high' | 'medium' | 'low';
export type ProductCategory = 'loans' | 'deposits' | 'fx' | 'cards' | 'insurance' | 'investment' | 'payment' | 'external';
export type UpdateType = 'assigned' | 'status_change' | 'value_update' | 'date_change' | 'response' | 'closed';

export interface PortfolioManager {
  id: string;
  name: string;
  email: string;
  portfolioName: string;
  customerCount: number;
}

export interface CustomerGroup {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  sector: Sector;
  segment: Segment;
  status: CustomerStatus;
  principalityScore: number; // 0-100
  lastActivityDate: string;
  portfolioManagerId: string;
  totalActionsPlanned: number;
  totalActionsNotPlanned: number;
  groupId?: string; // Optional group association
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  isExternal: boolean;
  description: string;
  displayOrder?: number;
}

export interface CustomerProduct {
  id: string;
  customerId: string;
  productId: string;
  currentValue: number;
  threshold?: number; // From product_thresholds table
  externalData?: number; // For external products
  gap?: number; // threshold - currentValue (computed)
  actionsCount: number;
}

// Updated Action interface matching the new schema
export interface Action {
  id: string;
  customerId: string;
  productId: string;
  name: string;
  description: string;
  creatorName: string;
  creationReason?: string;
  customerHints?: string;
  sourceDataDate: string;
  actionTargetDate: string;
  type: ActionType;
  priority: Priority;
  targetValue?: number;
  // Current state (denormalized)
  currentStatus: ActionStatus;
  currentOwnerId?: string;
  currentOwnerType?: string; // 'system' or 'user'
  currentPlannedDate?: string;
  currentValue?: number;
  createdAt: string;
  updatedAt: string;
}

// Action Update for tracking all changes/responses
export interface ActionUpdate {
  id: string;
  actionId: string;
  updateType: UpdateType;
  previousStatus?: ActionStatus;
  newStatus?: ActionStatus;
  previousValue?: number;
  newValue?: number;
  previousDate?: string;
  newDate?: string;
  previousOwnerId?: string;
  newOwnerId?: string;
  previousOwnerType?: string;
  newOwnerType?: string;
  responseText?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ProductPerformanceRow {
  count: number;
  targetPercent: number;
  yoy: number;
  mom: number;
  volume: number;
  volumeTargetPercent: number;
  volumeYoy: number;
  volumeMom: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: ProductCategory;
  stock: ProductPerformanceRow;
  flow: ProductPerformanceRow;
  actionsPlanned: number;
  actionsNotPlanned: number;
  status: 'on_track' | 'at_risk' | 'critical';
}

export interface PortfolioSummary {
  totalCustomers: number;
  primaryBankCustomers: number;
  nonPrimaryCustomers: number;
  primaryBankScore: number;
  primaryBankScoreYoY: number;
  primaryBankScoreMoM: number;
  totalActionsPlanned: number;
  totalActionsCompleted: number;
  totalActionsPending: number;
}
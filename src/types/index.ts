// Core Types for Account Planning Application

export type Sector = 'Agriculture' | 'Manufacturing' | 'Services' | 'Technology' | 'Healthcare' | 'Retail' | 'Energy';
export type Segment = 'Small' | 'Medium' | 'Large Enterprise';
export type ActionStatus = 'pending' | 'planned' | 'completed' | 'postponed' | 'not_interested' | 'not_possible';
export type ActionType = 'model_based' | 'ad_hoc';
export type Priority = 'high' | 'medium' | 'low';
export type ProductCategory = 'loans' | 'deposits' | 'fx' | 'cards' | 'insurance' | 'investment' | 'payment' | 'external';

export interface PortfolioManager {
  id: string;
  name: string;
  email: string;
  portfolioName: string;
  customerCount: number;
}

export interface Customer {
  id: string;
  name: string;
  sector: Sector;
  segment: Segment;
  isPrimaryBank: boolean;
  principalityScore: number; // 0-100
  lastActivityDate: string;
  portfolioManagerId: string;
  totalActionsPlanned: number;
  totalActionsNotPlanned: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  isExternal: boolean;
  description: string;
}

export interface CustomerProduct {
  id: string;
  customerId: string;
  productId: string;
  currentValue: number;
  threshold: number;
  externalData?: number; // For external products
  gap: number; // threshold - currentValue
  actionsCount: number;
}

export interface Action {
  id: string;
  customerId: string;
  productId: string;
  name: string;
  description: string;
  type: ActionType;
  priority: Priority;
  status: ActionStatus;
  targetValue?: number;
  plannedDate?: string;
  completedDate?: string;
  explanation?: string;
  timeToReady: number; // days
  createdAt: string;
  actionResponse?: string; // Response/feedback from customer
  estimatedActionTime?: number; // Estimated time to complete action in days
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  category: ProductCategory;
  customerCount: number;
  customerTargetPercent: number;
  customerYoy: number;
  customerMom: number;
  totalVolume: number;
  volumeYoy: number;
  volumeMom: number;
  volumeTargetPercent: number;
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

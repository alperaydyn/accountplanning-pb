// Required fields for each action type
export interface ActionRequiredField {
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select';
  options?: string[];
}

export const actionRequirements: Record<string, ActionRequiredField[]> = {
  'Increase credit limit': [
    { name: 'Current credit limit', type: 'currency' },
    { name: 'Requested limit', type: 'currency' },
    { name: 'Monthly revenue', type: 'currency' },
    { name: 'Credit score', type: 'number' },
  ],
  'Cross-sell deposit product': [
    { name: 'Current deposit amount', type: 'currency' },
    { name: 'Target deposit amount', type: 'currency' },
    { name: 'Preferred term', type: 'select', options: ['3 months', '6 months', '12 months', '24 months'] },
    { name: 'Interest rate expectation', type: 'text' },
  ],
  'Renew loan facility': [
    { name: 'Current loan amount', type: 'currency' },
    { name: 'Renewal amount', type: 'currency' },
    { name: 'Current interest rate', type: 'text' },
    { name: 'Maturity date', type: 'date' },
    { name: 'Collateral type', type: 'text' },
  ],
  'Upgrade card tier': [
    { name: 'Current card type', type: 'text' },
    { name: 'Target card tier', type: 'select', options: ['Gold', 'Platinum', 'Black', 'Infinite'] },
    { name: 'Monthly spend amount', type: 'currency' },
    { name: 'Annual income', type: 'currency' },
  ],
  'Offer insurance bundle': [
    { name: 'Insurance type', type: 'select', options: ['Life', 'Health', 'Property', 'Vehicle', 'Business'] },
    { name: 'Coverage amount', type: 'currency' },
    { name: 'Number of beneficiaries', type: 'number' },
    { name: 'Existing policies', type: 'text' },
  ],
  'Migrate to digital channels': [
    { name: 'Current channel usage', type: 'text' },
    { name: 'Preferred digital platform', type: 'select', options: ['Mobile App', 'Web Banking', 'Both'] },
    { name: 'Monthly transaction volume', type: 'number' },
    { name: 'Technical readiness level', type: 'select', options: ['Low', 'Medium', 'High'] },
  ],
  'Consolidate accounts': [
    { name: 'Number of accounts', type: 'number' },
    { name: 'Total balance across accounts', type: 'currency' },
    { name: 'Primary account type', type: 'text' },
    { name: 'Consolidation timeline', type: 'select', options: ['Immediate', '1 month', '3 months'] },
  ],
  'Propose FX hedging': [
    { name: 'Monthly FX exposure', type: 'currency' },
    { name: 'Primary currency pairs', type: 'text' },
    { name: 'Hedging duration', type: 'select', options: ['3 months', '6 months', '12 months'] },
    { name: 'Risk tolerance', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'] },
  ],
  'Introduce trade finance': [
    { name: 'Annual trade volume', type: 'currency' },
    { name: 'Primary trading countries', type: 'text' },
    { name: 'Trade finance type', type: 'select', options: ['Letter of Credit', 'Documentary Collection', 'Trade Loan', 'Factoring'] },
    { name: 'Current trade finance provider', type: 'text' },
  ],
  'Expand investment portfolio': [
    { name: 'Current portfolio value', type: 'currency' },
    { name: 'Target investment amount', type: 'currency' },
    { name: 'Risk profile', type: 'select', options: ['Conservative', 'Balanced', 'Growth', 'Aggressive'] },
    { name: 'Investment horizon', type: 'select', options: ['1-3 years', '3-5 years', '5-10 years', '10+ years'] },
    { name: 'Preferred asset classes', type: 'text' },
  ],
  'Get customer info': [
    { name: 'Number of employees', type: 'number' },
    { name: 'Payment amount', type: 'currency' },
    { name: 'Current payment provider', type: 'text' },
    { name: 'Current budget', type: 'currency' },
  ],
};

export const getRequirementsForAction = (actionName: string): ActionRequiredField[] => {
  return actionRequirements[actionName] || [];
};

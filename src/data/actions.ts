import { Action, ActionType, Priority, ActionStatus } from '@/types';
import { customers } from './customers';
import { products } from './products';

const actionNames = [
  'Increase credit limit',
  'Cross-sell deposit product',
  'Renew loan facility',
  'Upgrade card tier',
  'Offer insurance bundle',
  'Migrate to digital channels',
  'Consolidate accounts',
  'Propose FX hedging',
  'Introduce trade finance',
  'Expand investment portfolio'
];

const actionDescriptions = [
  'Based on recent transaction patterns and improved risk profile',
  'Customer shows high liquidity, ideal for deposit products',
  'Existing facility expiring, competitive rates available',
  'Usage patterns indicate need for higher card tier',
  'Gap analysis shows under-penetration in insurance',
  'Cost reduction opportunity through digital migration',
  'Multiple accounts can be consolidated for efficiency',
  'FX exposure risk identified, hedging recommended',
  'International trade volume increasing, TF products suitable',
  'Investment capacity detected from cash flow analysis'
];

const statuses: ActionStatus[] = ['pending', 'planned', 'completed', 'postponed', 'not_interested', 'not_possible'];
const priorities: Priority[] = ['high', 'medium', 'low'];
const types: ActionType[] = ['model_based', 'ad_hoc'];

const generateDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Generate actions for customers
export const actions: Action[] = [];

let actionId = 1;
customers.forEach((customer, custIndex) => {
  // Generate 2-6 actions per customer
  const actionCount = Math.floor(Math.random() * 5) + 2;
  
  for (let i = 0; i < actionCount; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    actions.push({
      id: `action-${actionId++}`,
      customerId: customer.id,
      productId: product.id,
      name: actionNames[i % actionNames.length],
      description: actionDescriptions[i % actionDescriptions.length],
      type: types[Math.floor(Math.random() * types.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status,
      targetValue: Math.floor(Math.random() * 500000) + 100000,
      plannedDate: status === 'planned' ? generateDate(Math.floor(Math.random() * 30) + 1) : undefined,
      completedDate: status === 'completed' ? generateDate(-Math.floor(Math.random() * 14)) : undefined,
      explanation: status === 'not_interested' || status === 'not_possible' 
        ? 'Customer declined due to existing commitments with competitor' 
        : undefined,
      timeToReady: Math.floor(Math.random() * 14) + 1,
      createdAt: generateDate(-Math.floor(Math.random() * 60)),
    });
  }
});

export const getActionsByCustomerId = (customerId: string): Action[] => {
  return actions.filter(a => a.customerId === customerId);
};

export const getActionsByProductId = (customerId: string, productId: string): Action[] => {
  return actions.filter(a => a.customerId === customerId && a.productId === productId);
};

export const getPendingActionsCount = (): number => {
  return actions.filter(a => a.status === 'pending').length;
};

export const getPlannedActionsCount = (): number => {
  return actions.filter(a => a.status === 'planned').length;
};

export const getCompletedActionsCount = (): number => {
  return actions.filter(a => a.status === 'completed').length;
};

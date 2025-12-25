import { Action, ActionType, Priority, ActionStatus } from '@/types';
import { customers } from './customers';
import { products } from './products';

export const actionNames = [
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

const actionResponses = [
  'Customer is interested, requested more details',
  'Scheduled a meeting for next week',
  'Customer requested pricing comparison',
  'Under review by customer finance team',
  'Customer prefers to wait until next quarter',
  'Positive initial feedback received',
  'Customer asked for documentation',
  'Awaiting internal approval from customer',
  'Customer comparing with competitor offers',
  'Customer needs board approval first'
];

const explanations = [
  'Customer has shown interest based on recent engagement patterns',
  'Analysis of transaction history indicates strong fit',
  'Risk assessment completed with positive outcome',
  'Customer segment analysis recommends this action',
  'Market conditions favorable for this proposal',
  'Customer relationship manager recommended prioritization',
  'Similar customers have high conversion rate for this action',
  'Gap analysis identified opportunity for value creation',
  'Customer feedback from previous interactions supports this',
  'Competitive intelligence suggests timing is optimal'
];

const statuses: ActionStatus[] = ['pending', 'planned', 'completed', 'postponed', 'not_interested', 'not_possible'];
const priorities: Priority[] = ['high', 'medium', 'low'];
const types: ActionType[] = ['model_based', 'ad_hoc'];

const generateDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Pre-assign products to customers (each customer gets 5-15 products)
const customerProductAssignments: Map<string, string[]> = new Map();

customers.forEach(customer => {
  const productCount = Math.floor(Math.random() * 11) + 5;
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, productCount);
  customerProductAssignments.set(customer.id, shuffledProducts.map(p => p.id));
});

// Generate actions for customers based on their assigned products
export const actions: Action[] = [];

let actionId = 1;
customers.forEach((customer, custIndex) => {
  const customerProductIds = customerProductAssignments.get(customer.id) || [];
  
  // Determine action count: half of customers get more than 1 action per product on average
  const isHighActionCustomer = custIndex % 2 === 0;
  
  // For each product, generate 0-3 actions (more for high action customers)
  customerProductIds.forEach((productId, prodIndex) => {
    const baseActionCount = isHighActionCustomer 
      ? Math.floor(Math.random() * 3) + 1  // 1-3 actions
      : Math.floor(Math.random() * 2);      // 0-1 actions
    
    for (let i = 0; i < baseActionCount; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const hasResponse = Math.random() > 0.4; // 60% have a response
      
      actions.push({
        id: `action-${actionId++}`,
        customerId: customer.id,
        productId: productId,
        name: actionNames[(prodIndex + i) % actionNames.length],
        description: actionDescriptions[(prodIndex + i) % actionDescriptions.length],
        type: types[Math.floor(Math.random() * types.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status,
        targetValue: Math.floor(Math.random() * 500000) + 100000,
        plannedDate: status === 'planned' ? generateDate(Math.floor(Math.random() * 30) + 1) : undefined,
        completedDate: status === 'completed' ? generateDate(-Math.floor(Math.random() * 14)) : undefined,
        explanation: explanations[(prodIndex + i) % explanations.length],
        timeToReady: Math.floor(Math.random() * 14) + 1,
        createdAt: generateDate(-Math.floor(Math.random() * 60)),
        actionResponse: hasResponse ? actionResponses[Math.floor(Math.random() * actionResponses.length)] : undefined,
        estimatedActionTime: Math.floor(Math.random() * 30) + 5, // 5-35 days
      });
    }
  });
});

// Export customer product assignments for use in customerProducts.ts
export const getCustomerProductIds = (customerId: string): string[] => {
  return customerProductAssignments.get(customerId) || [];
};

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

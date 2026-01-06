import { Action, ActionType, Priority, ActionStatus, UpdateType } from '@/types';
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

const creationReasons = [
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

const customerHints = [
  'Mention competitor rates to create urgency',
  'Focus on relationship benefits and loyalty rewards',
  'Highlight recent success stories from similar customers',
  'Emphasize cost savings and efficiency gains',
  'Present as a package deal with existing products'
];

const creatorNames = [
  'AI Model v2.1',
  'Segment Analysis Engine',
  'Risk Assessment System',
  'Portfolio Optimizer',
  'Customer Insight AI'
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
      const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      actions.push({
        id: `action-${actionId++}`,
        customerId: customer.id,
        productId: productId,
        name: actionNames[(prodIndex + i) % actionNames.length],
        description: actionDescriptions[(prodIndex + i) % actionDescriptions.length],
        creatorName: creatorNames[Math.floor(Math.random() * creatorNames.length)],
        creationReason: creationReasons[(prodIndex + i) % creationReasons.length],
        customerHints: customerHints[Math.floor(Math.random() * customerHints.length)],
        sourceDataDate: generateDate(-Math.floor(Math.random() * 30)),
        actionTargetDate: generateDate(Math.floor(Math.random() * 30) + 1),
        type: types[Math.floor(Math.random() * types.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        targetValue: Math.floor(Math.random() * 500000) + 100000,
        currentStatus,
        currentOwnerId: currentStatus !== 'pending' ? 'pm-1' : undefined,
        currentOwnerType: currentStatus !== 'pending' ? 'user' : 'system',
        currentPlannedDate: currentStatus === 'planned' ? generateDate(Math.floor(Math.random() * 30) + 1) : undefined,
        currentValue: currentStatus === 'completed' ? Math.floor(Math.random() * 500000) + 100000 : undefined,
        createdAt: generateDate(-Math.floor(Math.random() * 60)),
        updatedAt: generateDate(-Math.floor(Math.random() * 7)),
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
  return actions.filter(a => a.currentStatus === 'pending').length;
};

export const getPlannedActionsCount = (): number => {
  return actions.filter(a => a.currentStatus === 'planned').length;
};

export const getCompletedActionsCount = (): number => {
  return actions.filter(a => a.currentStatus === 'completed').length;
};
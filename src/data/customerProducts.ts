import { CustomerProduct } from '@/types';
import { customers } from './customers';
import { products } from './products';
import { actions, getCustomerProductIds } from './actions';

// Generate customer-product relationships
export const customerProducts: CustomerProduct[] = [];

let cpId = 1;
customers.forEach(customer => {
  // Get product IDs assigned to this customer (from actions.ts)
  const productIds = getCustomerProductIds(customer.id);
  
  productIds.forEach(productId => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const threshold = Math.floor(Math.random() * 1000000) + 100000;
    const currentValue = Math.floor(Math.random() * threshold * 1.3); // Can exceed threshold
    const customerActions = actions.filter(
      a => a.customerId === customer.id && a.productId === productId
    );
    
    customerProducts.push({
      id: `cp-${cpId++}`,
      customerId: customer.id,
      productId: productId,
      currentValue,
      threshold,
      externalData: product.isExternal ? Math.floor(Math.random() * 500000) : undefined,
      gap: threshold - currentValue,
      actionsCount: customerActions.length,
    });
  });
});

export const getCustomerProducts = (customerId: string): CustomerProduct[] => {
  return customerProducts.filter(cp => cp.customerId === customerId);
};

export const getCustomerProductByProductId = (customerId: string, productId: string): CustomerProduct | undefined => {
  return customerProducts.find(cp => cp.customerId === customerId && cp.productId === productId);
};

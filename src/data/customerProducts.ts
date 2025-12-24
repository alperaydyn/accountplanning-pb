import { CustomerProduct } from '@/types';
import { customers } from './customers';
import { products } from './products';
import { actions } from './actions';

// Generate customer-product relationships
export const customerProducts: CustomerProduct[] = [];

let cpId = 1;
customers.forEach(customer => {
  // Each customer has 5-15 products
  const productCount = Math.floor(Math.random() * 11) + 5;
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, productCount);
  
  shuffledProducts.forEach(product => {
    const threshold = Math.floor(Math.random() * 1000000) + 100000;
    const currentValue = Math.floor(Math.random() * threshold * 1.3); // Can exceed threshold
    const customerActions = actions.filter(
      a => a.customerId === customer.id && a.productId === product.id
    );
    
    customerProducts.push({
      id: `cp-${cpId++}`,
      customerId: customer.id,
      productId: product.id,
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

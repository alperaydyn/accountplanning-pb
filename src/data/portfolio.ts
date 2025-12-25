import { PortfolioManager, PortfolioSummary, ProductPerformance } from '@/types';
import { customers } from './customers';
import { products } from './products';
import { actions } from './actions';

export const currentUser: PortfolioManager = {
  id: 'pm-1',
  name: 'Ahmet Yılmaz',
  email: 'ahmet.yilmaz@bank.com',
  portfolioName: 'Corporate Banking - Region 1',
  customerCount: customers.length,
};

export const getPortfolioSummary = (): PortfolioSummary => {
  const primaryBankCustomers = customers.filter(c => c.isPrimaryBank).length;
  const nonPrimaryCustomers = customers.length - primaryBankCustomers;
  const primaryBankScore = Math.round((primaryBankCustomers / customers.length) * 100);
  
  return {
    totalCustomers: customers.length,
    primaryBankCustomers,
    nonPrimaryCustomers,
    primaryBankScore,
    primaryBankScoreYoY: 5.2, // Mock improvement
    primaryBankScoreMoM: 1.8,
    totalActionsPlanned: actions.filter(a => a.status === 'planned').length,
    totalActionsCompleted: actions.filter(a => a.status === 'completed').length,
    totalActionsPending: actions.filter(a => a.status === 'pending').length,
  };
};

export const getProductPerformance = (): ProductPerformance[] => {
  return products.slice(0, 15).map(product => {
    const productActions = actions.filter(a => a.productId === product.id);
    const planned = productActions.filter(a => a.status === 'planned' || a.status === 'completed').length;
    const notPlanned = productActions.filter(a => a.status === 'pending').length;
    
    const customerCount = Math.floor(Math.random() * 30) + 10;
    const customerYoyChange = Math.floor(Math.random() * 10) - 3; // -3 to +7 customers
    const customerMomChange = Math.floor(Math.random() * 5) - 2; // -2 to +3 customers
    
    const totalVolume = Math.round((Math.random() * 50 + 10) * 100) / 100; // 10-60M
    const volumeYoyChange = Math.round((Math.random() * 10 - 3) * 10) / 10; // -3M to +7M
    const volumeMomChange = Math.round((Math.random() * 4 - 1.5) * 10) / 10; // -1.5M to +2.5M
    
    let status: 'on_track' | 'at_risk' | 'critical' = 'on_track';
    if (customerYoyChange < 0) status = 'critical';
    else if (customerYoyChange < 2) status = 'at_risk';
    
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      customerCount,
      customerTargetPercent: Math.round((Math.random() * 40) + 60), // 60-100%
      customerYoy: customerYoyChange,
      customerMom: customerMomChange,
      totalVolume,
      volumeYoy: volumeYoyChange,
      volumeMom: volumeMomChange,
      volumeTargetPercent: Math.round((Math.random() * 50) + 50), // 50-100%
      actionsPlanned: planned,
      actionsNotPlanned: notPlanned,
      status,
    };
  });
};

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
    const customerYoy = (Math.random() * 20) - 5; // -5% to +15%
    const customerMom = (Math.random() * 8) - 2; // -2% to +6%
    const volumeYoy = (Math.random() * 30) - 10; // -10% to +20%
    const volumeMom = (Math.random() * 10) - 3; // -3% to +7%
    
    let status: 'on_track' | 'at_risk' | 'critical' = 'on_track';
    if (customerYoy < 0) status = 'critical';
    else if (customerYoy < 5) status = 'at_risk';
    
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      customerCount: Math.floor(Math.random() * 30) + 10,
      customerTargetPercent: Math.round((Math.random() * 40) + 60), // 60-100%
      customerYoy: Math.round(customerYoy * 10) / 10,
      customerMom: Math.round(customerMom * 10) / 10,
      totalVolume: Math.round((Math.random() * 50 + 10) * 100) / 100, // 10-60M
      volumeYoy: Math.round(volumeYoy * 10) / 10,
      volumeMom: Math.round(volumeMom * 10) / 10,
      volumeTargetPercent: Math.round((Math.random() * 50) + 50), // 50-100%
      actionsPlanned: planned,
      actionsNotPlanned: notPlanned,
      status,
    };
  });
};

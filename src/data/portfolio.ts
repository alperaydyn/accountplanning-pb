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
    const yoyChange = (Math.random() * 20) - 5; // -5% to +15%
    const momChange = (Math.random() * 8) - 2; // -2% to +6%
    
    let status: 'on_track' | 'at_risk' | 'critical' = 'on_track';
    if (yoyChange < 0) status = 'critical';
    else if (yoyChange < 5) status = 'at_risk';
    
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      customerCount: Math.floor(Math.random() * 30) + 10,
      yoyChange: Math.round(yoyChange * 10) / 10,
      momChange: Math.round(momChange * 10) / 10,
      actionsPlanned: planned,
      actionsNotPlanned: notPlanned,
      status,
    };
  });
};

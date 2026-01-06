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
  const primaryBankCustomers = customers.filter(c => c.status === 'primary').length;
  const nonPrimaryCustomers = customers.length - primaryBankCustomers;
  const primaryBankScore = Math.round((primaryBankCustomers / customers.length) * 100);
  
  return {
    totalCustomers: customers.length,
    primaryBankCustomers,
    nonPrimaryCustomers,
    primaryBankScore,
    primaryBankScoreYoY: 5.2, // Mock improvement
    primaryBankScoreMoM: 1.8,
    totalActionsPlanned: actions.filter(a => a.currentStatus === 'planned').length,
    totalActionsCompleted: actions.filter(a => a.currentStatus === 'completed').length,
    totalActionsPending: actions.filter(a => a.currentStatus === 'pending').length,
  };
};

export const getProductPerformance = (): ProductPerformance[] => {
  return products.slice(0, 15).map(product => {
    const productActions = actions.filter(a => a.productId === product.id);
    const planned = productActions.filter(a => a.currentStatus === 'planned' || a.currentStatus === 'completed').length;
    const notPlanned = productActions.filter(a => a.currentStatus === 'pending').length;
    
    // Stock figures (existing/cumulative)
    const stockCount = Math.floor(Math.random() * 30) + 10;
    const stockVolume = Math.round((Math.random() * 50 + 10) * 100) / 100;
    const stockCountYoy = Math.floor(Math.random() * 10) - 3;
    const stockCountMom = Math.floor(Math.random() * 5) - 2;
    const stockVolumeYoy = Math.round((Math.random() * 10 - 3) * 10) / 10;
    const stockVolumeMom = Math.round((Math.random() * 4 - 1.5) * 10) / 10;
    
    // Flow figures (new/changes over period)
    const flowCount = Math.floor(Math.random() * 15) + 2;
    const flowVolume = Math.round((Math.random() * 20 + 2) * 100) / 100;
    const flowCountYoy = Math.floor(Math.random() * 8) - 2;
    const flowCountMom = Math.floor(Math.random() * 4) - 1;
    const flowVolumeYoy = Math.round((Math.random() * 6 - 2) * 10) / 10;
    const flowVolumeMom = Math.round((Math.random() * 3 - 1) * 10) / 10;
    
    let status: 'on_track' | 'at_risk' | 'critical' = 'on_track';
    if (stockCountYoy < 0) status = 'critical';
    else if (stockCountYoy < 2) status = 'at_risk';
    
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      stock: {
        count: stockCount,
        targetPercent: Math.round((Math.random() * 40) + 60),
        yoy: stockCountYoy,
        mom: stockCountMom,
        volume: stockVolume,
        volumeTargetPercent: Math.round((Math.random() * 50) + 50),
        volumeYoy: stockVolumeYoy,
        volumeMom: stockVolumeMom,
      },
      flow: {
        count: flowCount,
        targetPercent: Math.round((Math.random() * 40) + 60),
        yoy: flowCountYoy,
        mom: flowCountMom,
        volume: flowVolume,
        volumeTargetPercent: Math.round((Math.random() * 50) + 50),
        volumeYoy: flowVolumeYoy,
        volumeMom: flowVolumeMom,
      },
      actionsPlanned: planned,
      actionsNotPlanned: notPlanned,
      status,
    };
  });
};
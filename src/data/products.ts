import { Product } from '@/types';

export const products: Product[] = [
  // Internal Loan Products
  { id: 'loan-cash', name: 'Cash Loan', category: 'loans', isExternal: false, description: 'General purpose cash loans' },
  { id: 'loan-investment', name: 'Investment Loan', category: 'loans', isExternal: false, description: 'Loans for capital investments' },
  { id: 'loan-foreign', name: 'Foreign Currency Loan', category: 'loans', isExternal: false, description: 'Loans in foreign currencies' },
  { id: 'loan-spot', name: 'Spot Loan', category: 'loans', isExternal: false, description: 'Short-term spot loans' },
  { id: 'loan-trade', name: 'Trade Finance Loan', category: 'loans', isExternal: false, description: 'Trade financing solutions' },
  
  // External Loan Products
  { id: 'ext-loan-cash', name: 'Cash Loan (External)', category: 'external', isExternal: true, description: 'Cash loans at other banks' },
  { id: 'ext-loan-investment', name: 'Investment Loan (External)', category: 'external', isExternal: true, description: 'Investment loans at other banks' },
  { id: 'ext-loan-foreign', name: 'Foreign Currency Loan (External)', category: 'external', isExternal: true, description: 'FX loans at other banks' },
  
  // Deposit Products
  { id: 'deposit-tl', name: 'TL Deposit', category: 'deposits', isExternal: false, description: 'Turkish Lira deposits' },
  { id: 'deposit-fx', name: 'FX Deposit', category: 'deposits', isExternal: false, description: 'Foreign currency deposits' },
  { id: 'deposit-gold', name: 'Gold Deposit', category: 'deposits', isExternal: false, description: 'Gold-backed deposits' },
  
  // External Deposits
  { id: 'ext-deposit-tl', name: 'TL Deposit (External)', category: 'external', isExternal: true, description: 'TL deposits at other banks' },
  { id: 'ext-deposit-fx', name: 'FX Deposit (External)', category: 'external', isExternal: true, description: 'FX deposits at other banks' },
  
  // FX Products
  { id: 'fx-spot', name: 'FX Spot', category: 'fx', isExternal: false, description: 'Spot FX transactions' },
  { id: 'fx-forward', name: 'FX Forward', category: 'fx', isExternal: false, description: 'Forward FX contracts' },
  { id: 'fx-swap', name: 'FX Swap', category: 'fx', isExternal: false, description: 'FX swap transactions' },
  
  // Card Products
  { id: 'card-corporate', name: 'Corporate Card', category: 'cards', isExternal: false, description: 'Corporate credit cards' },
  { id: 'card-fleet', name: 'Fleet Card', category: 'cards', isExternal: false, description: 'Fleet management cards' },
  { id: 'card-purchasing', name: 'Purchasing Card', category: 'cards', isExternal: false, description: 'Business purchasing cards' },
  
  // Insurance Products
  { id: 'ins-property', name: 'Property Insurance', category: 'insurance', isExternal: false, description: 'Commercial property insurance' },
  { id: 'ins-liability', name: 'Liability Insurance', category: 'insurance', isExternal: false, description: 'Business liability coverage' },
  { id: 'ins-health', name: 'Group Health Insurance', category: 'insurance', isExternal: false, description: 'Employee health insurance' },
  
  // Investment Products
  { id: 'inv-mutual', name: 'Mutual Funds', category: 'investment', isExternal: false, description: 'Investment fund products' },
  { id: 'inv-bonds', name: 'Corporate Bonds', category: 'investment', isExternal: false, description: 'Bond investments' },
  { id: 'inv-equity', name: 'Equity Products', category: 'investment', isExternal: false, description: 'Stock market products' },
  
  // Payment Products
  { id: 'pay-salary', name: 'Salary Payment', category: 'payment', isExternal: false, description: 'Payroll services' },
  { id: 'pay-swift', name: 'SWIFT Transfer', category: 'payment', isExternal: false, description: 'International transfers' },
  { id: 'pay-eft', name: 'EFT Transfer', category: 'payment', isExternal: false, description: 'Electronic fund transfers' },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(p => p.category === category);
};

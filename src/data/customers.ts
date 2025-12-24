import { Customer, Sector, Segment } from '@/types';

const sectors: Sector[] = ['Agriculture', 'Manufacturing', 'Services', 'Technology', 'Healthcare', 'Retail', 'Energy'];
const segments: Segment[] = ['Small', 'Medium', 'Large Enterprise'];

const customerNames = [
  'Aksan Holding', 'Berke Industries', 'Ceylan Group', 'Deniz Maritime', 'Eren Tech',
  'Firat Construction', 'Gunes Energy', 'Hasat Agriculture', 'Ileri Manufacturing', 'Jale Textiles',
  'Kaya Steel', 'Lale Pharmaceuticals', 'Mert Logistics', 'Narin Foods', 'Ozan Electronics',
  'Pinar Dairy', 'Ruzgar Wind Power', 'Selin Healthcare', 'Tarim Co-op', 'Umut Mining',
  'Vatan Motors', 'Yildiz Hotels', 'Zirve Software', 'Atlas Exports', 'Bora Shipping',
  'Cinar Real Estate', 'Doga Organics', 'Ege Chemicals', 'Flora Cosmetics', 'Global Trading',
  'Harmony Music', 'Ideal Solutions', 'Jupiter Aerospace', 'Kartal Aviation', 'Luna Technologies',
  'Mega Retail', 'Nova Biotech', 'Orbit Telecom', 'Prime Investments', 'Quest Innovations',
  'Royal Hospitality', 'Sigma Consulting', 'Terra Agriculture', 'Unity Finance', 'Vista Properties',
  'Wave Renewable', 'Xenon Labs', 'Yeni Nesil Corp', 'Zenith Capital', 'Alfa Dynamics'
];

const generateDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const customers: Customer[] = customerNames.map((name, index) => ({
  id: `cust-${index + 1}`,
  name,
  sector: sectors[index % sectors.length],
  segment: segments[index % segments.length],
  isPrimaryBank: Math.random() > 0.4, // ~60% primary bank
  principalityScore: Math.floor(Math.random() * 40) + 60, // 60-100
  lastActivityDate: generateDate(Math.floor(Math.random() * 30)),
  portfolioManagerId: 'pm-1',
  totalActionsPlanned: Math.floor(Math.random() * 8),
  totalActionsNotPlanned: Math.floor(Math.random() * 5),
}));

export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(c => c.id === id);
};

export const getCustomersByFilter = (
  searchTerm?: string,
  sector?: Sector | 'all',
  segment?: Segment | 'all',
  isPrimaryBank?: boolean | 'all'
): Customer[] => {
  return customers.filter(c => {
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (sector && sector !== 'all' && c.sector !== sector) return false;
    if (segment && segment !== 'all' && c.segment !== segment) return false;
    if (isPrimaryBank !== undefined && isPrimaryBank !== 'all' && c.isPrimaryBank !== isPrimaryBank) return false;
    return true;
  });
};

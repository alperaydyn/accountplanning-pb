import { Customer, CustomerGroup, CustomerStatus, Sector, Segment } from '@/types';

const sectors: Sector[] = ['Agriculture', 'Manufacturing', 'Services', 'Technology', 'Healthcare', 'Retail', 'Energy'];
const segments: Segment[] = ['Small', 'Medium', 'Large Enterprise'];
const statuses: CustomerStatus[] = ['inactive', 'active', 'target', 'strong_target', 'primary'];

// Customer Groups
export const customerGroups: CustomerGroup[] = [
  { id: 'grp-1', name: 'Koç Holding' },
  { id: 'grp-2', name: 'Sabancı Holding' },
  { id: 'grp-3', name: 'Zorlu Holding' },
  { id: 'grp-4', name: 'Eczacıbaşı Holding' },
  { id: 'grp-5', name: 'Doğuş Holding' },
  { id: 'grp-6', name: 'Yıldız Holding' },
  { id: 'grp-7', name: 'Borusan Holding' },
  { id: 'grp-8', name: 'Anadolu Grubu' },
];

// Map some customers to groups (indices)
const customerGroupAssignments: Record<number, string> = {
  0: 'grp-1',  // Aksan Holding
  5: 'grp-1',  // Firat Construction
  10: 'grp-1', // Kaya Steel
  1: 'grp-2',  // Berke Industries
  8: 'grp-2',  // Ileri Manufacturing
  15: 'grp-2', // Pinar Dairy
  2: 'grp-3',  // Ceylan Group
  6: 'grp-3',  // Gunes Energy
  16: 'grp-3', // Ruzgar Wind Power
  3: 'grp-4',  // Deniz Maritime
  11: 'grp-4', // Lale Pharmaceuticals
  17: 'grp-4', // Selin Healthcare
  4: 'grp-5',  // Eren Tech
  22: 'grp-5', // Zirve Software
  34: 'grp-5', // Luna Technologies
  7: 'grp-6',  // Hasat Agriculture
  13: 'grp-6', // Narin Foods
  27: 'grp-6', // Doga Organics
  9: 'grp-7',  // Jale Textiles
  24: 'grp-7', // Bora Shipping
  12: 'grp-8', // Mert Logistics
  20: 'grp-8', // Vatan Motors
  21: 'grp-8', // Yildiz Hotels
};

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
  status: statuses[index % statuses.length],
  principalityScore: Math.floor(Math.random() * 40) + 60, // 60-100
  lastActivityDate: generateDate(Math.floor(Math.random() * 30)),
  portfolioManagerId: 'pm-1',
  totalActionsPlanned: Math.floor(Math.random() * 8),
  totalActionsNotPlanned: Math.floor(Math.random() * 5),
  groupId: customerGroupAssignments[index], // May be undefined
}));

export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find(c => c.id === id);
};

export const getGroupById = (id: string): CustomerGroup | undefined => {
  return customerGroups.find(g => g.id === id);
};

export const getCustomersByFilter = (
  searchTerm?: string,
  sector?: Sector | 'all',
  segment?: Segment | 'all',
  status?: CustomerStatus | 'all'
): Customer[] => {
  return customers.filter(c => {
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (sector && sector !== 'all' && c.sector !== sector) return false;
    if (segment && segment !== 'all' && c.segment !== segment) return false;
    if (status && status !== 'all' && c.status !== status) return false;
    return true;
  });
};

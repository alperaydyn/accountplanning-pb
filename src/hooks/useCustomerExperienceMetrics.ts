import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface CustomerExperienceMetrics {
  id: string;
  portfolio_manager_id: string;
  record_month: string;
  
  // Key Moment 1: Müşteri Ziyareti
  visit_count: number;
  active_customers: number;
  
  // Key Moment 2: Acil Finansal Destek
  customers_with_open_limit: number;
  
  // Key Moment 3: Dijital Kanal
  successful_logins: number;
  total_logins: number;
  help_desk_tickets: number;
  branch_help_tickets: number;
  
  // Key Moment 4: Kritik Ödemeler
  digital_salary_payments: number;
  total_salary_payments: number;
  successful_payments: number;
  total_payments: number;
  
  // Key Moment 5: Nakit Yönetimi
  ete_product_score: number;
  
  // Key Moment 6: Hızlı Destek
  total_complaints: number;
  total_requests: number;
  positive_nps: number;
  total_surveys: number;
  
  overall_score: number;
  created_at: string;
  updated_at: string;
}

export interface KeyMomentScore {
  id: string;
  name: string;
  nameEn: string;
  score: number;
  target: number;
  status: 'success' | 'warning' | 'critical';
  variables: {
    name: string;
    value: number;
    target: number;
    unit: string;
    formula?: string;
  }[];
}

export const calculateKeyMoments = (metrics: CustomerExperienceMetrics | null): KeyMomentScore[] => {
  if (!metrics) {
    return getDefaultKeyMoments();
  }

  const activeCustomers = metrics.active_customers || 1;

  // Key Moment 1: Müşteri Ziyareti
  const visitRate = activeCustomers > 0 ? (metrics.visit_count / activeCustomers) * 100 : 0;
  
  // Key Moment 2: Acil Finansal Destek
  const openLimitRate = activeCustomers > 0 ? (metrics.customers_with_open_limit / activeCustomers) * 100 : 0;
  
  // Key Moment 3: Dijital Kanal
  const loginSuccessRate = metrics.total_logins > 0 ? (metrics.successful_logins / metrics.total_logins) * 100 : 0;
  const helpDeskRate = metrics.branch_help_tickets > 0 ? (metrics.help_desk_tickets / metrics.branch_help_tickets) * 100 : 0;
  const digitalChannelScore = (loginSuccessRate * 0.5 + helpDeskRate * 0.5);
  
  // Key Moment 4: Kritik Ödemeler
  const digitalSalaryRate = metrics.total_salary_payments > 0 ? (metrics.digital_salary_payments / metrics.total_salary_payments) * 100 : 0;
  const paymentSuccessRate = metrics.total_payments > 0 ? (metrics.successful_payments / metrics.total_payments) * 100 : 0;
  const criticalPaymentsScore = (digitalSalaryRate * 0.5 + paymentSuccessRate * 0.5);
  
  // Key Moment 5: Nakit Yönetimi
  const cashManagementScore = metrics.ete_product_score || 0;
  
  // Key Moment 6: Hızlı Destek
  const complaintRate = activeCustomers > 0 ? ((metrics.total_complaints + metrics.total_requests) / activeCustomers) * 100 : 0;
  const npsRate = metrics.total_surveys > 0 ? (metrics.positive_nps / metrics.total_surveys) * 100 : 0;
  // For complaint rate, lower is better (target is <5%)
  const complaintScore = Math.max(0, 100 - (complaintRate * 20)); // 5% = 0 score
  const quickSupportScore = (complaintScore * 0.5 + npsRate * 0.5);

  const getStatus = (score: number, target: number, inverse = false): 'success' | 'warning' | 'critical' => {
    if (inverse) {
      if (score <= target) return 'success';
      if (score <= target * 1.5) return 'warning';
      return 'critical';
    }
    if (score >= target) return 'success';
    if (score >= target * 0.75) return 'warning';
    return 'critical';
  };

  return [
    {
      id: 'customer-visit',
      name: 'Müşteri Ziyareti',
      nameEn: 'Customer Visit',
      score: Math.round(visitRate),
      target: 50,
      status: getStatus(visitRate, 50),
      variables: [
        { name: 'Ziyaret Sayısı / Aktif Müşteri', value: visitRate, target: 50, unit: '%', formula: 'visit_count / active_customers' },
      ],
    },
    {
      id: 'urgent-financial-support',
      name: 'Acil Finansal Destek',
      nameEn: 'Urgent Financial Support',
      score: Math.round(openLimitRate),
      target: 60,
      status: getStatus(openLimitRate, 60),
      variables: [
        { name: 'Açık Limitli Müşteri / Aktif Müşteri', value: openLimitRate, target: 60, unit: '%', formula: 'customers_with_open_limit / active_customers' },
      ],
    },
    {
      id: 'digital-channel',
      name: 'Dijital Kanal',
      nameEn: 'Digital Channel',
      score: Math.round(digitalChannelScore),
      target: 72.5, // Average of 95 and 50
      status: getStatus(digitalChannelScore, 72.5),
      variables: [
        { name: 'Başarılı Login / Tüm Loginler', value: loginSuccessRate, target: 95, unit: '%', formula: 'successful_logins / total_logins' },
        { name: 'Yardım Masası / Şube Kayıtları', value: helpDeskRate, target: 50, unit: '%', formula: 'help_desk_tickets / branch_help_tickets' },
      ],
    },
    {
      id: 'critical-payments',
      name: 'Kritik Ödemeler',
      nameEn: 'Critical Payments',
      score: Math.round(criticalPaymentsScore),
      target: 75, // Average of 60 and 90
      status: getStatus(criticalPaymentsScore, 75),
      variables: [
        { name: 'Dijital Maaş Ödemeleri / Tüm Maaş Ödemeleri', value: digitalSalaryRate, target: 60, unit: '%', formula: 'digital_salary_payments / total_salary_payments' },
        { name: 'Başarılı Ödemeler / Tüm Ödemeler', value: paymentSuccessRate, target: 90, unit: '%', formula: 'successful_payments / total_payments' },
      ],
    },
    {
      id: 'cash-management',
      name: 'Nakit Yönetimi',
      nameEn: 'Cash Management',
      score: Math.round(cashManagementScore),
      target: 60,
      status: getStatus(cashManagementScore, 60),
      variables: [
        { name: 'ETE Ürünü Skoru', value: cashManagementScore, target: 60, unit: '%', formula: 'ete_product_score' },
      ],
    },
    {
      id: 'quick-support',
      name: 'Hızlı Destek',
      nameEn: 'Quick Support',
      score: Math.round(quickSupportScore),
      target: 87.5,
      status: getStatus(quickSupportScore, 87.5),
      variables: [
        { name: 'Şikayet + Talep / Aktif Müşteri', value: complaintRate, target: 5, unit: '%', formula: '(complaints + requests) / active_customers' },
        { name: 'Olumlu NPS / Toplam Anket', value: npsRate, target: 80, unit: '%', formula: 'positive_nps / total_surveys' },
      ],
    },
  ];
};

const getDefaultKeyMoments = (): KeyMomentScore[] => [
  { id: 'customer-visit', name: 'Müşteri Ziyareti', nameEn: 'Customer Visit', score: 0, target: 50, status: 'critical', variables: [] },
  { id: 'urgent-financial-support', name: 'Acil Finansal Destek', nameEn: 'Urgent Financial Support', score: 0, target: 60, status: 'critical', variables: [] },
  { id: 'digital-channel', name: 'Dijital Kanal', nameEn: 'Digital Channel', score: 0, target: 72.5, status: 'critical', variables: [] },
  { id: 'critical-payments', name: 'Kritik Ödemeler', nameEn: 'Critical Payments', score: 0, target: 75, status: 'critical', variables: [] },
  { id: 'cash-management', name: 'Nakit Yönetimi', nameEn: 'Cash Management', score: 0, target: 60, status: 'critical', variables: [] },
  { id: 'quick-support', name: 'Hızlı Destek', nameEn: 'Quick Support', score: 0, target: 87.5, status: 'critical', variables: [] },
];

export const calculateOverallScore = (keyMoments: KeyMomentScore[]): number => {
  if (keyMoments.length === 0) return 0;
  const totalScore = keyMoments.reduce((acc, km) => acc + km.score, 0);
  return Math.round(totalScore / keyMoments.length);
};

export const useCustomerExperienceMetrics = (recordMonth?: string) => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['customer-experience-metrics', portfolioManager?.id, recordMonth],
    queryFn: async () => {
      if (!portfolioManager?.id) return null;

      const query = supabase
        .from('customer_experience_metrics')
        .select('*')
        .eq('portfolio_manager_id', portfolioManager.id);

      if (recordMonth) {
        query.eq('record_month', recordMonth);
      } else {
        query.order('record_month', { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as CustomerExperienceMetrics | null;
    },
    enabled: !!portfolioManager?.id,
  });
};

// Fetch last N months of metrics for historical timeline
export const useCustomerExperienceHistory = (months: number = 3) => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['customer-experience-history', portfolioManager?.id, months],
    queryFn: async () => {
      if (!portfolioManager?.id) return [];

      const { data, error } = await supabase
        .from('customer_experience_metrics')
        .select('*')
        .eq('portfolio_manager_id', portfolioManager.id)
        .order('record_month', { ascending: false })
        .limit(months);

      if (error) throw error;
      return (data as CustomerExperienceMetrics[]) || [];
    },
    enabled: !!portfolioManager?.id,
  });
};

export const useCreateCustomerExperienceMetrics = () => {
  const queryClient = useQueryClient();
  const { data: portfolioManager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (input: Partial<CustomerExperienceMetrics> & { record_month: string }) => {
      if (!portfolioManager?.id) throw new Error('No portfolio manager');

      // Check if record exists
      const { data: existing } = await supabase
        .from('customer_experience_metrics')
        .select('id')
        .eq('portfolio_manager_id', portfolioManager.id)
        .eq('record_month', input.record_month)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('customer_experience_metrics')
          .update(input)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('customer_experience_metrics')
          .insert({
            ...input,
            portfolio_manager_id: portfolioManager.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-experience-metrics'] });
    },
  });
};

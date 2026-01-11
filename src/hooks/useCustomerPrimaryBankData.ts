import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LoanSummary {
  bank_code: string;
  cash_loan: number;
  non_cash_loan: number;
  our_bank_flag: boolean;
  last_approval_date: string | null;
}

interface PosData {
  total_pos_volume: number;
  our_bank_pos_volume: number;
  pos_share: number;
  number_of_banks: number;
}

interface ChequeData {
  cheque_volume_1m: number;
  cheque_volume_3m: number;
  cheque_volume_12m: number;
}

interface CollateralData {
  bank_code: string;
  group1_amount: number;
  group2_amount: number;
  group3_amount: number;
  group4_amount: number;
  our_bank_flag: boolean;
}

interface CustomerPrimaryBankData {
  loanSummary: LoanSummary[];
  posData: PosData | null;
  chequeData: ChequeData | null;
  collateral: CollateralData[];
  scores: {
    loanShare: number;
    posShare: number;
    chequeActive: boolean;
    collateralShare: number;
    overallScore: number;
    hasLoanData: boolean;
    hasPosData: boolean;
    hasChequeData: boolean;
    hasCollateralData: boolean;
  };
  hasData: boolean;
}

export const useCustomerPrimaryBankData = (customerId: string | undefined, recordMonth?: string) => {
  return useQuery({
    queryKey: ["customer-primary-bank-data", customerId, recordMonth],
    queryFn: async (): Promise<CustomerPrimaryBankData> => {
      if (!customerId) {
        return {
          loanSummary: [],
          posData: null,
          chequeData: null,
          collateral: [],
          scores: {
            loanShare: 0,
            posShare: 0,
            chequeActive: false,
            collateralShare: 0,
            overallScore: 0,
            hasLoanData: false,
            hasPosData: false,
            hasChequeData: false,
            hasCollateralData: false,
          },
          hasData: false,
        };
      }

      // Fetch loan summary data
      const { data: loanData } = await supabase
        .from("primary_bank_loan_summary")
        .select("*")
        .eq("customer_id", customerId);

      // Fetch POS data
      const { data: posData } = await supabase
        .from("primary_bank_pos")
        .select("*")
        .eq("customer_id", customerId)
        .maybeSingle();

      // Fetch cheque data
      const { data: chequeData } = await supabase
        .from("primary_bank_cheque")
        .select("*")
        .eq("customer_id", customerId)
        .maybeSingle();

      // Fetch collateral data
      const { data: collateralData } = await supabase
        .from("primary_bank_collateral")
        .select("*")
        .eq("customer_id", customerId);

      // Calculate scores
      // Loan Share
      let totalLoan = 0;
      let ourBankLoan = 0;
      (loanData || []).forEach((loan) => {
        const loanAmount = Number(loan.cash_loan || 0) + Number(loan.non_cash_loan || 0);
        totalLoan += loanAmount;
        if (loan.our_bank_flag) {
          ourBankLoan += loanAmount;
        }
      });
      const loanShare = totalLoan > 0 ? Math.round((ourBankLoan / totalLoan) * 100) : 0;

      // POS Share
      const posShare = posData ? Number(posData.pos_share || 0) : 0;

      // Cheque Activity
      const chequeActive = chequeData ? Number(chequeData.cheque_volume_12m || 0) > 0 : false;

      // Collateral Share
      let totalCollateral = 0;
      let ourBankCollateral = 0;
      (collateralData || []).forEach((col) => {
        const colAmount = 
          Number(col.group1_amount || 0) +
          Number(col.group2_amount || 0) +
          Number(col.group3_amount || 0) +
          Number(col.group4_amount || 0);
        totalCollateral += colAmount;
        if (col.our_bank_flag) {
          ourBankCollateral += colAmount;
        }
      });
      const collateralShare = totalCollateral > 0 ? Math.round((ourBankCollateral / totalCollateral) * 100) : 0;

      // Track which data categories exist
      const hasLoanData = totalLoan > 0;
      const hasPosData = posData !== null && Number(posData.total_pos_volume || 0) > 0;
      const hasChequeData = chequeData !== null;
      const hasCollateralData = totalCollateral > 0;

      // Overall score: only include categories that have data in the weighted average
      // Weights: loan=0.4, pos=0.30, cheque=0.20, collateral=0.10
      const chequeScore = chequeActive ? 100 : 0;
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      if (hasLoanData) {
        weightedSum += loanShare * 0.4;
        totalWeight += 0.4;
      }
      if (hasPosData) {
        weightedSum += posShare * 0.3;
        totalWeight += 0.3;
      }
      if (hasChequeData) {
        weightedSum += chequeScore * 0.2;
        totalWeight += 0.2;
      }
      if (hasCollateralData) {
        weightedSum += collateralShare * 0.1;
        totalWeight += 0.1;
      }
      
      const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) / 100 : 0;
      const normalizedScore = Math.round(overallScore);

      const hasData = (loanData?.length || 0) > 0 || posData !== null || chequeData !== null || (collateralData?.length || 0) > 0;

      return {
        loanSummary: (loanData || []).map(loan => ({
          bank_code: loan.bank_code,
          cash_loan: Number(loan.cash_loan || 0),
          non_cash_loan: Number(loan.non_cash_loan || 0),
          our_bank_flag: loan.our_bank_flag,
          last_approval_date: loan.last_approval_date,
        })),
        posData: posData ? {
          total_pos_volume: Number(posData.total_pos_volume || 0),
          our_bank_pos_volume: Number(posData.our_bank_pos_volume || 0),
          pos_share: Number(posData.pos_share || 0),
          number_of_banks: Number(posData.number_of_banks || 0),
        } : null,
        chequeData: chequeData ? {
          cheque_volume_1m: Number(chequeData.cheque_volume_1m || 0),
          cheque_volume_3m: Number(chequeData.cheque_volume_3m || 0),
          cheque_volume_12m: Number(chequeData.cheque_volume_12m || 0),
        } : null,
        collateral: (collateralData || []).map(col => ({
          bank_code: col.bank_code,
          group1_amount: Number(col.group1_amount || 0),
          group2_amount: Number(col.group2_amount || 0),
          group3_amount: Number(col.group3_amount || 0),
          group4_amount: Number(col.group4_amount || 0),
          our_bank_flag: col.our_bank_flag,
        })),
        scores: {
          loanShare,
          posShare,
          chequeActive,
          collateralShare,
          overallScore: normalizedScore,
          hasLoanData,
          hasPosData,
          hasChequeData,
          hasCollateralData,
        },
        hasData,
      };
    },
    enabled: !!customerId,
  });
};

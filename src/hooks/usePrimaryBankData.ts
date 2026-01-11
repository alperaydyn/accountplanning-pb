import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PrimaryBankShareOfWallet {
  loanShare: number;
  posShare: number;
  chequeShare: number;
  collateralShare: number;
  overallScore: number;
}

interface UsePrimaryBankDataOptions {
  customerIds: string[];
  recordMonth?: string;
}

export const usePrimaryBankData = ({ customerIds, recordMonth }: UsePrimaryBankDataOptions) => {
  return useQuery({
    queryKey: ["primary-bank-data", customerIds.sort().join(","), recordMonth],
    queryFn: async (): Promise<PrimaryBankShareOfWallet> => {
      if (customerIds.length === 0) {
        return {
          loanShare: 0,
          posShare: 0,
          chequeShare: 0,
          collateralShare: 0,
          overallScore: 0,
        };
      }

      // Fetch loan summary data
      const { data: loanData } = await supabase
        .from("primary_bank_loan_summary")
        .select("*")
        .in("customer_id", customerIds);

      // Fetch POS data
      const { data: posData } = await supabase
        .from("primary_bank_pos")
        .select("*")
        .in("customer_id", customerIds);

      // Fetch cheque data
      const { data: chequeData } = await supabase
        .from("primary_bank_cheque")
        .select("*")
        .in("customer_id", customerIds);

      // Fetch collateral data
      const { data: collateralData } = await supabase
        .from("primary_bank_collateral")
        .select("*")
        .in("customer_id", customerIds);

      // Calculate Loan Share of Wallet
      let totalOurBankLoan = 0;
      let totalAllBankLoan = 0;
      (loanData || []).forEach((loan) => {
        const loanAmount = Number(loan.cash_loan || 0) + Number(loan.non_cash_loan || 0);
        totalAllBankLoan += loanAmount;
        if (loan.our_bank_flag) {
          totalOurBankLoan += loanAmount;
        }
      });
      const loanShare = totalAllBankLoan > 0 ? Math.round((totalOurBankLoan / totalAllBankLoan) * 100) : 0;

      // Calculate POS Share of Wallet (average of pos_share across customers)
      let totalPosShare = 0;
      let posCustomerCount = 0;
      (posData || []).forEach((pos) => {
        if (Number(pos.total_pos_volume || 0) > 0) {
          totalPosShare += Number(pos.pos_share || 0);
          posCustomerCount++;
        }
      });
      const posShare = posCustomerCount > 0 ? Math.round(totalPosShare / posCustomerCount) : 0;

      // Calculate Cheque Share - percentage of customers with cheque activity
      let customersWithCheque = 0;
      const chequeCustomerIds = new Set<string>();
      (chequeData || []).forEach((cheque) => {
        const hasActivity = Number(cheque.cheque_volume_12m || 0) > 0;
        if (hasActivity && !chequeCustomerIds.has(cheque.customer_id)) {
          chequeCustomerIds.add(cheque.customer_id);
          customersWithCheque++;
        }
      });
      const chequeShare = customerIds.length > 0 ? Math.round((customersWithCheque / customerIds.length) * 100) : 0;

      // Calculate Collateral Share of Wallet
      let totalOurBankCollateral = 0;
      let totalAllBankCollateral = 0;
      (collateralData || []).forEach((collateral) => {
        const collateralAmount = 
          Number(collateral.group1_amount || 0) +
          Number(collateral.group2_amount || 0) +
          Number(collateral.group3_amount || 0) +
          Number(collateral.group4_amount || 0);
        totalAllBankCollateral += collateralAmount;
        if (collateral.our_bank_flag) {
          totalOurBankCollateral += collateralAmount;
        }
      });
      const collateralShare = totalAllBankCollateral > 0 ? Math.round((totalOurBankCollateral / totalAllBankCollateral) * 100) : 0;

      // Calculate overall score: loan*0.4 + pos*0.30 + cheque*0.20 + collateral*0.10
      const overallScore = Math.round(
        loanShare * 0.4 +
        posShare * 0.3 +
        chequeShare * 0.2 +
        collateralShare * 0.1
      );

      return {
        loanShare,
        posShare,
        chequeShare,
        collateralShare,
        overallScore,
      };
    },
    enabled: customerIds.length > 0,
  });
};

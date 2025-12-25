export type AutopilotStepType = "automatic" | "human";

export interface AutopilotStep {
  id: string;
  name: string;
  type: AutopilotStepType;
  order: number;
}

export interface AutopilotInputField {
  id: string;
  name: string;
  label: string;
  type: "number" | "text" | "select";
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export interface AutopilotProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  inputs: AutopilotInputField[];
  steps: AutopilotStep[];
}

export interface AutopilotInstance {
  id: string;
  autopilotProductId: string;
  customerId: string;
  inputs: Record<string, string | number>;
  createdAt: string;
  status: "active" | "completed" | "cancelled";
  stepStatuses: Record<string, "pending" | "in_progress" | "completed">;
}

export const autopilotProducts: AutopilotProduct[] = [
  {
    id: "ap-1",
    name: "Installment Loan",
    description: "End-to-end installment loan processing with automated approvals",
    category: "lending",
    inputs: [
      { id: "amount", name: "amount", label: "Loan Amount (₺)", type: "number", placeholder: "100000", required: true },
      { id: "terms", name: "terms", label: "Terms (months)", type: "select", options: ["12", "24", "36", "48", "60"], required: true },
      { id: "interestRate", name: "interestRate", label: "Interest Rate (%)", type: "number", placeholder: "1.89", required: true },
    ],
    steps: [
      { id: "step-1", name: "Loan Proposal", type: "automatic", order: 1 },
      { id: "step-2", name: "Limit Allocation", type: "automatic", order: 2 },
      { id: "step-3", name: "Document Upload", type: "human", order: 3 },
      { id: "step-4", name: "Disbursement", type: "automatic", order: 4 },
      { id: "step-5", name: "Signature", type: "human", order: 5 },
    ],
  },
  {
    id: "ap-2",
    name: "Credit Card Issuance",
    description: "Complete credit card application and issuance workflow",
    category: "cards",
    inputs: [
      { id: "cardType", name: "cardType", label: "Card Type", type: "select", options: ["Standard", "Gold", "Platinum", "Business"], required: true },
      { id: "creditLimit", name: "creditLimit", label: "Credit Limit (₺)", type: "number", placeholder: "50000", required: true },
      { id: "deliveryAddress", name: "deliveryAddress", label: "Delivery Address", type: "text", placeholder: "Full address", required: true },
    ],
    steps: [
      { id: "step-1", name: "Credit Assessment", type: "automatic", order: 1 },
      { id: "step-2", name: "Limit Approval", type: "automatic", order: 2 },
      { id: "step-3", name: "Card Production", type: "automatic", order: 3 },
      { id: "step-4", name: "Address Verification", type: "human", order: 4 },
      { id: "step-5", name: "Card Delivery", type: "human", order: 5 },
      { id: "step-6", name: "Activation Call", type: "human", order: 6 },
    ],
  },
  {
    id: "ap-3",
    name: "Term Deposit Opening",
    description: "Automated term deposit account creation and fund transfer",
    category: "deposits",
    inputs: [
      { id: "depositAmount", name: "depositAmount", label: "Deposit Amount (₺)", type: "number", placeholder: "500000", required: true },
      { id: "term", name: "term", label: "Term Period", type: "select", options: ["1 month", "3 months", "6 months", "12 months"], required: true },
      { id: "interestPayment", name: "interestPayment", label: "Interest Payment", type: "select", options: ["Monthly", "Maturity"], required: true },
      { id: "sourceAccount", name: "sourceAccount", label: "Source Account", type: "text", placeholder: "Account number", required: true },
    ],
    steps: [
      { id: "step-1", name: "Rate Calculation", type: "automatic", order: 1 },
      { id: "step-2", name: "Account Creation", type: "automatic", order: 2 },
      { id: "step-3", name: "Fund Transfer", type: "automatic", order: 3 },
      { id: "step-4", name: "Confirmation Receipt", type: "automatic", order: 4 },
      { id: "step-5", name: "Customer Notification", type: "human", order: 5 },
    ],
  },
  {
    id: "ap-4",
    name: "Trade Finance Letter of Credit",
    description: "International trade LC issuance workflow",
    category: "trade",
    inputs: [
      { id: "lcAmount", name: "lcAmount", label: "LC Amount (USD)", type: "number", placeholder: "100000", required: true },
      { id: "beneficiary", name: "beneficiary", label: "Beneficiary Name", type: "text", placeholder: "Company name", required: true },
      { id: "expiryDate", name: "expiryDate", label: "Expiry Period", type: "select", options: ["30 days", "60 days", "90 days", "180 days"], required: true },
      { id: "shipmentTerms", name: "shipmentTerms", label: "Shipment Terms", type: "select", options: ["FOB", "CIF", "CFR", "EXW"], required: true },
    ],
    steps: [
      { id: "step-1", name: "Credit Line Check", type: "automatic", order: 1 },
      { id: "step-2", name: "LC Draft Preparation", type: "automatic", order: 2 },
      { id: "step-3", name: "Customer Review", type: "human", order: 3 },
      { id: "step-4", name: "SWIFT Message", type: "automatic", order: 4 },
      { id: "step-5", name: "Document Collection", type: "human", order: 5 },
      { id: "step-6", name: "Payment Processing", type: "automatic", order: 6 },
    ],
  },
  {
    id: "ap-5",
    name: "Insurance Policy Binding",
    description: "Corporate insurance policy setup and binding",
    category: "insurance",
    inputs: [
      { id: "policyType", name: "policyType", label: "Policy Type", type: "select", options: ["Property", "Liability", "Vehicle Fleet", "Key Person"], required: true },
      { id: "coverageAmount", name: "coverageAmount", label: "Coverage Amount (₺)", type: "number", placeholder: "1000000", required: true },
      { id: "premium", name: "premium", label: "Annual Premium (₺)", type: "number", placeholder: "25000", required: true },
      { id: "startDate", name: "startDate", label: "Policy Start", type: "text", placeholder: "DD/MM/YYYY", required: true },
    ],
    steps: [
      { id: "step-1", name: "Risk Assessment", type: "automatic", order: 1 },
      { id: "step-2", name: "Premium Calculation", type: "automatic", order: 2 },
      { id: "step-3", name: "Quote Presentation", type: "human", order: 3 },
      { id: "step-4", name: "Policy Document Generation", type: "automatic", order: 4 },
      { id: "step-5", name: "Customer Signature", type: "human", order: 5 },
      { id: "step-6", name: "Premium Collection", type: "automatic", order: 6 },
    ],
  },
  {
    id: "ap-6",
    name: "Merchant POS Setup",
    description: "Complete POS terminal deployment for merchant customers",
    category: "payments",
    inputs: [
      { id: "terminalCount", name: "terminalCount", label: "Number of Terminals", type: "number", placeholder: "3", required: true },
      { id: "terminalType", name: "terminalType", label: "Terminal Type", type: "select", options: ["Standard", "Mobile", "Integrated", "Virtual"], required: true },
      { id: "businessLocation", name: "businessLocation", label: "Installation Address", type: "text", placeholder: "Full address", required: true },
      { id: "mcc", name: "mcc", label: "Merchant Category", type: "select", options: ["Retail", "Restaurant", "Services", "E-commerce"], required: true },
    ],
    steps: [
      { id: "step-1", name: "Merchant Agreement", type: "automatic", order: 1 },
      { id: "step-2", name: "Terminal Configuration", type: "automatic", order: 2 },
      { id: "step-3", name: "Site Visit Scheduling", type: "human", order: 3 },
      { id: "step-4", name: "Installation", type: "human", order: 4 },
      { id: "step-5", name: "Test Transaction", type: "human", order: 5 },
      { id: "step-6", name: "Go-Live Notification", type: "automatic", order: 6 },
    ],
  },
];

// Store for autopilot instances (in-memory for demo)
let autopilotInstances: AutopilotInstance[] = [];

export const getAutopilotInstancesByCustomer = (customerId: string): AutopilotInstance[] => {
  return autopilotInstances.filter(i => i.customerId === customerId);
};

export const createAutopilotInstance = (
  autopilotProductId: string,
  customerId: string,
  inputs: Record<string, string | number>
): AutopilotInstance => {
  const product = autopilotProducts.find(p => p.id === autopilotProductId);
  const stepStatuses: Record<string, "pending" | "in_progress" | "completed"> = {};
  
  product?.steps.forEach(step => {
    stepStatuses[step.id] = "pending";
  });

  const instance: AutopilotInstance = {
    id: `api-${Date.now()}`,
    autopilotProductId,
    customerId,
    inputs,
    createdAt: new Date().toISOString(),
    status: "active",
    stepStatuses,
  };

  autopilotInstances.push(instance);
  return instance;
};

export const getAutopilotProductById = (id: string): AutopilotProduct | undefined => {
  return autopilotProducts.find(p => p.id === id);
};

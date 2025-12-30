export type ForeignCurrencyType = 'USD' | 'EUR' | 'GBP';

export const FOREIGN_CURRENCY_OPTIONS: ForeignCurrencyType[] = ['USD', 'EUR', 'GBP'];


// Foreign costs (in selected currency): airline_freight_cost, office_handling_cost
// Local costs (always TZS): all others

export interface ProductionCost {
  id: string;
  consignment_id: string;
  airline_freight_cost: number;
  office_handling_cost: number;
  arrival_clearance_cost: number;
  znz_airport_to_ferry_transport_cost: number;
  znz_to_dar_shipping_cost: number;
  dar_clearance_cost: number;
  dar_ferry_to_office_transport_cost: number;
  labour_helpers_cost: number;
  currency: string;
  notes: string | null;
  cost_date: string;
  revenue_total: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProductionCostWithConsignment extends ProductionCost {
  consignment: {
    id: string;
    consignment_name: string;
  };
  total_dead_weight: number;
  total_volumetric_weight: number;
  total_chargeable_weight: number;
}

export interface ConsignmentWithWeights {
  id: string;
  consignment_name: string;
  total_dead_weight: number;
  total_volumetric_weight: number;
  total_chargeable_weight: number;
}

// Form data type (with Date for cost_date)
export interface ProductionCostFormData {
  airline_freight_cost: number;
  office_handling_cost: number;
  arrival_clearance_cost: number;
  znz_airport_to_ferry_transport_cost: number;
  znz_to_dar_shipping_cost: number;
  dar_clearance_cost: number;
  dar_ferry_to_office_transport_cost: number;
  labour_helpers_cost: number;
  currency: ForeignCurrencyType;
  notes: string;
  cost_date: Date;
  revenue_total: number;
  
}

// Fields that use foreign currency
export const FOREIGN_CURRENCY_FIELDS = ['airline_freight_cost', 'office_handling_cost'];

// Fields that use TZS (local currency)
export const LOCAL_CURRENCY_FIELDS = [
  'arrival_clearance_cost',
  'znz_airport_to_ferry_transport_cost',
  'znz_to_dar_shipping_cost',
  'dar_clearance_cost',
  'dar_ferry_to_office_transport_cost',
  'labour_helpers_cost',
];

// Calculate totals separately for foreign and local costs
export const calculateForeignCosts = (cost: Partial<ProductionCost> | ProductionCostFormData): number => {
  return (Number(cost.airline_freight_cost) || 0) + (Number(cost.office_handling_cost) || 0);
};

export const calculateLocalCosts = (cost: Partial<ProductionCost> | ProductionCostFormData): number => {
  return (
    (Number(cost.arrival_clearance_cost) || 0) +
    (Number(cost.znz_airport_to_ferry_transport_cost) || 0) +
    (Number(cost.znz_to_dar_shipping_cost) || 0) +
    (Number(cost.dar_clearance_cost) || 0) +
    (Number(cost.dar_ferry_to_office_transport_cost) || 0) +
    (Number(cost.labour_helpers_cost) || 0)
  );
};

// Calculate profit (revenue - foreign costs for now, since currencies differ)
export const calculateProfit = (revenue: number, foreignCost: number): number => {
  return (Number(revenue) || 0) - (Number(foreignCost) || 0);
};

// Calculate profit margin percentage (null-safe)
export const calculateProfitMargin = (revenue: number, profit: number): string => {
  const revenueNum = Number(revenue) || 0;
  if (revenueNum <= 0) return 'N/A';
  const margin = (profit / revenueNum) * 100;
  return margin.toFixed(1) + '%';
};

export const calculateCostPerKg = (totalCost: number, weight: number | null): string => {
  if (!weight || weight === 0) return 'N/A';
  return (totalCost / weight).toFixed(2);
};

export const formatForeignCurrency = (value: number, currency: ForeignCurrencyType | string): string => {
  const numValue = Number(value) || 0;
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return `${symbols[currency] || '$'}${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatTZS = (value: number): string => {
  const numValue = Number(value) || 0;
  return `TSh ${numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Safe number formatting helper
export const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
  const numValue = Number(value) || 0;
  return numValue.toFixed(decimals);
};

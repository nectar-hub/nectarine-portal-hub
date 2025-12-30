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
  currency: string; // Foreign currency for airline/office costs
  notes: string | null;
  cost_date: string;
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
  return (cost.airline_freight_cost || 0) + (cost.office_handling_cost || 0);
};

export const calculateLocalCosts = (cost: Partial<ProductionCost> | ProductionCostFormData): number => {
  return (
    (cost.arrival_clearance_cost || 0) +
    (cost.znz_airport_to_ferry_transport_cost || 0) +
    (cost.znz_to_dar_shipping_cost || 0) +
    (cost.dar_clearance_cost || 0) +
    (cost.dar_ferry_to_office_transport_cost || 0) +
    (cost.labour_helpers_cost || 0)
  );
};

export const calculateCostPerKg = (totalCost: number, weight: number | null): string => {
  if (!weight || weight === 0) return 'N/A';
  return (totalCost / weight).toFixed(2);
};

export const formatForeignCurrency = (value: number, currency: ForeignCurrencyType | string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return `${symbols[currency] || '$'}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatTZS = (value: number): string => {
  return `TSh ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

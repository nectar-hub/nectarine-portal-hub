export type PurchaseRegion = 'UK' | 'US' | 'UAE' | 'CN' | 'EU' | 'AU';

export type PurchaseStatus = 
  | 'PENDING'
  | 'ORDERED'
  | 'RECEIVED'
  | 'IN TRANSIT'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface PurchaseTracker {
  id: string;
  invoice_date: string;
  client_id: string;
  client_name?: string; // Joined from air_cargo_clients
  invoice_no: string | null;
  item_description: string;
  qty: number;
  from_region: PurchaseRegion;
  store_name: string | null;
  amount: number | null;
  dop: string | null;
  store_order_no: string | null;
  purchased_by: string | null;
  dod: string | null;
  status: PurchaseStatus;
  remarks: string | null;
  source_link: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PurchaseFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  clientId?: string;
  region?: PurchaseRegion;
  store?: string;
  status?: PurchaseStatus;
  search?: string;
}

export const PURCHASE_STATUS_COLORS: Record<PurchaseStatus, string> = {
  PENDING: 'bg-gray-500',
  ORDERED: 'bg-blue-600',
  RECEIVED: 'bg-emerald-600',
  'IN TRANSIT': 'bg-purple-600',
  READY: 'bg-orange-500',
  DELIVERED: 'bg-green-600',
  CANCELLED: 'bg-red-600',
};

export const REGION_CURRENCIES: Record<PurchaseRegion, { symbol: string; code: string }> = {
  UK: { symbol: '£', code: 'GBP' },
  US: { symbol: '$', code: 'USD' },
  UAE: { symbol: 'AED ', code: 'AED' },
  CN: { symbol: '¥', code: 'CNY' },
  EU: { symbol: '€', code: 'EUR' },
  AU: { symbol: 'A$', code: 'AUD' },
};

export const PURCHASED_BY_OPTIONS = [
  'HEBRON',
  'COBBY',
  'SYSTEM',
  'OTHER',
];

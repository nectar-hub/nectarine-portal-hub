export type PurchaseRegion = 'UK' | 'US' | 'UAE' | 'CN' | 'EU' | 'AU';
export type PurchaseStatus = 'PENDING' | 'ORDERED' | 'RECEIVED' | 'IN_TRANSIT' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface PurchaseTracker {
  id: string;
  invoice_date: string;
  client_id: string;
  client_name?: string;
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

export const REGION_CURRENCIES = {
  UK: { symbol: '£', code: 'GBP' },
  US: { symbol: '$', code: 'USD' },
  UAE: { symbol: 'AED ', code: 'AED' },
  CN: { symbol: '¥', code: 'CNY' },
  EU: { symbol: '€', code: 'EUR' },
  AU: { symbol: 'A$', code: 'AUD' },
} as const;

export const PURCHASE_STATUS_COLORS = {
  PENDING: 'bg-gray-500',
  ORDERED: 'bg-blue-600',
  RECEIVED: 'bg-teal-600',
  IN_TRANSIT: 'bg-purple-600',
  READY: 'bg-orange-500',
  DELIVERED: 'bg-green-600',
  CANCELLED: 'bg-red-600',
} as const;

export const PURCHASED_BY_OPTIONS = ['HEBRON', 'COBBY'] as const;

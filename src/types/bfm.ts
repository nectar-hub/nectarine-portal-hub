export interface BfmCartItem {
  id: string;
  user_id: string;
  store_name: string | null;
  product_url: string;
  product_name: string;
  product_image_url: string | null;
  variant_color: string | null;
  variant_size: string | null;
  quantity: number;
  unit_price: number | null;
  currency: string;
  estimated_tax: number;
  estimated_shipping: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BfmOrderStatus =
  | 'DRAFT' | 'SUBMITTED' | 'AWAITING_PAYMENT' | 'PAID' | 'PURCHASED'
  | 'IN_TRANSIT' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED';

export type BfmPaymentMethod = 'OFFLINE' | 'DPO';
export type BfmPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface BfmOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: BfmOrderStatus;
  payment_method: BfmPaymentMethod;
  payment_status: BfmPaymentStatus;
  currency: string;
  subtotal: number;
  total_tax: number;
  total_shipping: number;
  grand_total: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  items?: BfmOrderItem[];
  user_email?: string;
  user_name?: string;
}

export interface BfmOrderItem {
  id: string;
  order_id: string;
  store_name: string | null;
  product_url: string;
  product_name: string;
  product_image_url: string | null;
  variant_color: string | null;
  variant_size: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  tax: number;
  shipping: number;
  line_total: number;
  created_at: string;
}

export interface ScrapedProduct {
  product_name: string;
  price: number | null;
  currency: string;
  image_url: string;
  store_name: string;
  available_sizes: string[];
  available_colors: string[];
  description: string;
  source_url: string;
}

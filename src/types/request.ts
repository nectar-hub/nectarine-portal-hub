
export interface RequestItem {
  id: string;
  product_name: string;
  product_url?: string;
  quantity: number;
  price?: number;
  color?: string;
  size?: string;
  store_name?: string;
  buy_request_id: string;
}

export interface Request {
  id: string;
  user_id: string;
  request_type: 'buy_request' | 'self_purchase';
  product_name: string;
  store_name?: string;
  quantity: number;
  price?: number;
  status: string;
  created_at: string;
  updated_at: string;
  country?: string;
  product_url?: string;
  color?: string;
  size?: string;
  notes?: string;
  screenshot_url?: string;
  delivery_deadline?: string;
  invoice_url?: string;
  tracking_number?: string;
  courier?: string;
  items?: RequestItem[];
  user_email?: string;
  user_name?: string;
}

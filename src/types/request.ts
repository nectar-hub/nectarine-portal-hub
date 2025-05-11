
export type RequestItem = {
  id?: string;
  product_name: string;
  store_name?: string;
  quantity: number;
  price?: number;
  color?: string;
  size?: string;
  product_url?: string;
};

export type Request = {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  request_type: 'buy_request' | 'self_purchase';
  product_name: string;
  store_name: string;
  quantity: number;
  price?: number;
  status: string;
  created_at: string;
  country?: string;
  product_url?: string;
  color?: string;
  size?: string;
  notes?: string;
  screenshot_url?: string;
  delivery_deadline?: string;
  // Self-purchase specific fields
  tracking_number?: string;
  courier?: string;
  invoice_url?: string;
  // Optional items array for multi-item orders
  items?: RequestItem[];
};

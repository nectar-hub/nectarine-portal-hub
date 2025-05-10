
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
};

export interface SearchProduct {
  product_name: string;
  product_url: string;
  image_url: string;
  price: number | null;
  currency: string;
  store_name: string;
}

export interface StoreSearchResult {
  success: boolean;
  store: string;
  query: string;
  search_url: string;
  items: SearchProduct[];
  next_page_url: string | null;
  error?: string;
}

export const STORES = [
  { key: 'amazon', name: 'Amazon', icon: '🛒' },
  { key: 'ebay', name: 'eBay', icon: '🏷️' },
  { key: 'walmart', name: 'Walmart', icon: '🏪' },
  { key: 'aliexpress', name: 'AliExpress', icon: '📦' },
  { key: 'zara', name: 'Zara', icon: '👗' },
  { key: 'asos', name: 'ASOS', icon: '👟' },
] as const;

export type StoreKey = typeof STORES[number]['key'];

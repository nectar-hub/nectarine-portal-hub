
export interface BuyRequestItem {
  id: string; // Local ID for form management
  productName: string;
  productUrl: string;
  quantity: string;
  color?: string;
  size?: string;
  productPrice: string;
}

export interface BuyRequestFormValues {
  items: BuyRequestItem[];
  notes?: string;
  screenshot?: FileList;
}

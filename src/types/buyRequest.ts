
export interface BuyRequestItem {
  id: string;
  productName: string;
  productUrl: string;
  quantity: string;
  productPrice: string;
  color: string;
  size: string;
  storeName?: string; // Added store name field
}

export interface BuyRequestFormValues {
  items: BuyRequestItem[];
  notes?: string;
  screenshot?: FileList;
}

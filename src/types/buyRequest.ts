
export interface BuyRequestItem {
  id: string;
  productName: string;
  productUrl: string;
  quantity: string;
  productPrice: string;
  color: string;
  size: string;
  storeName?: string;
}

export interface BuyRequestFormValues {
  items: BuyRequestItem[];
  notes?: string;
  screenshot?: FileList;
  country?: string; // Added country field to match usage in buyRequestService.ts
}

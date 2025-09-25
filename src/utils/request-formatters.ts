
import { Request, RequestItem } from "@/types/request";

export function formatBuyRequests(
  buyRequests: any[], 
  buyRequestItems: Record<string, RequestItem[]> = {}
): Request[] {
  return buyRequests.map(req => {
    // Check if this request has multiple items
    const items = buyRequestItems[req.id] || [];
    
    console.log(`[FORMAT] Request ${req.id} has ${items.length} additional items`);
    console.log(`[FORMAT] Additional items for ${req.id}:`, items);
    
    // Create the main item from the buy_request record
    const mainItem: RequestItem = {
      id: `main-${req.id}`,
      buy_request_id: req.id,
      product_name: req.product_name,
      product_url: req.product_url,
      quantity: req.quantity,
      price: req.product_price,
      color: req.color,
      size: req.size,
      store_name: req.store_name
    };
    
    // Combine main item with additional items
    const allItems = [mainItem, ...items];
    
    console.log(`[FORMAT] Total items for request ${req.id}:`, allItems.length);
    
    return {
      id: req.id,
      user_id: req.user_id,
      request_type: 'buy_request' as const,
      product_name: req.product_name,
      store_name: req.store_name || 'Unknown',
      quantity: req.quantity,
      price: req.product_price,
      status: req.status,
      created_at: req.created_at,
      updated_at: req.updated_at,
      country: req.country_of_purchase,
      product_url: req.product_url,
      color: req.color,
      size: req.size,
      notes: req.notes,
      screenshot_url: req.screenshot_url,
      delivery_deadline: req.delivery_deadline,
      // Critical fix: Include ALL items (main + additional)
      items: allItems,
      // Add user details from profiles join
      user_email: req.profiles?.email || 'Unknown',
      user_name: req.profiles?.full_name || 'Unknown'
    };
  });
}

// Add aliases for the formatBuyRequests and formatSelfPurchases functions
export const formatBuyRequestsData = formatBuyRequests;
export const formatSelfPurchasesData = formatSelfPurchases;

export function formatSelfPurchases(selfPurchases: any[]): Request[] {
  return selfPurchases.map(purchase => ({
    id: purchase.id,
    user_id: purchase.user_id,
    request_type: 'self_purchase' as const,
    product_name: purchase.description,
    store_name: purchase.store_name,
    quantity: purchase.quantity,
    price: purchase.estimated_value,
    status: purchase.status,
    created_at: purchase.created_at,
    updated_at: purchase.updated_at,
    notes: purchase.notes,
    invoice_url: purchase.invoice_url,
    tracking_number: purchase.tracking_number,
    courier: purchase.courier,
    product_type: purchase.product_type, // Include the product type from database
    // Add empty items array for consistency
    items: [],
    // Add user details from profiles join
    user_email: purchase.profiles?.email || 'Unknown',
    user_name: purchase.profiles?.full_name || 'Unknown'
  }));
}

export function addUserDetailsToRequests(requests: Request[], users: any[]): Request[] {
  if (requests.length === 0) return [];
  
  return requests.map(req => {
    const user = users?.find(u => u.id === req.user_id);
    return {
      ...req,
      user_email: user?.email || 'Unknown',
      user_name: user?.full_name || 'Unknown'
    };
  });
}

export function sortRequestsByDate(requests: Request[]): Request[] {
  return [...requests].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

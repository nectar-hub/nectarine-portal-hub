
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestItem } from "@/types/request";

export async function fetchBuyRequests(filter: string = 'all') {
  try {
    // Create a query based on the filter
    let buyRequestsQuery = supabase
      .from('buy_requests')
      .select(`
        id, user_id, product_name, store_name, quantity, product_price, 
        country_of_purchase, status, created_at, updated_at, 
        product_url, notes, screenshot_url, delivery_deadline, color, size
      `);
      
    // Apply filter if it's not 'all'
    if (filter !== 'all') {
      buyRequestsQuery = buyRequestsQuery.eq('status', filter);
    }
    
    const { data: buyRequests, error: buyError } = await buyRequestsQuery;
    
    if (buyError) {
      console.error("Error fetching buy requests:", buyError);
      throw new Error(`Error fetching buy requests: ${buyError.message}`);
    }
    
    if (!buyRequests) {
      console.log("No buy requests found");
      return [];
    }

    return buyRequests;
  } catch (error: any) {
    console.error("Error in fetchBuyRequests:", error);
    throw error;
  }
}

export async function fetchBuyRequestItems(buyRequestIds: string[]) {
  try {
    if (buyRequestIds.length === 0) return {};
    
    const { data: items, error: itemsError } = await supabase
      .from('buy_request_items')
      .select('*')
      .in('buy_request_id', buyRequestIds);
    
    if (itemsError) {
      console.warn("Error fetching buy request items:", itemsError);
      return {};
    }
    
    if (!items || items.length === 0) {
      return {};
    }
    
    // Group items by buy_request_id
    const buyRequestItems: Record<string, RequestItem[]> = {};
    
    items.forEach(item => {
      const requestId = item.buy_request_id;
      if (!buyRequestItems[requestId]) {
        buyRequestItems[requestId] = [];
      }
      
      buyRequestItems[requestId].push({
        id: item.id,
        product_name: item.product_name,
        product_url: item.product_url,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        size: item.size,
        store_name: item.store_name,
        buy_request_id: item.buy_request_id
      });
    });
    
    return buyRequestItems;
  } catch (error: any) {
    console.error("Error in fetchBuyRequestItems:", error);
    return {};
  }
}

export async function fetchSelfPurchases(filter: string = 'all') {
  try {
    // Create a query based on the filter
    let selfPurchasesQuery = supabase
      .from('self_purchases')
      .select(`
        id, user_id, description, store_name, quantity, estimated_value, 
        status, created_at, updated_at, notes, invoice_url,
        tracking_number, courier
      `);
      
    // Apply filter if it's not 'all'
    if (filter !== 'all') {
      selfPurchasesQuery = selfPurchasesQuery.eq('status', filter);
    }
    
    const { data: selfPurchases, error: selfError } = await selfPurchasesQuery;
    
    if (selfError) {
      console.error("Error fetching self purchases:", selfError);
      throw new Error(`Error fetching self purchases: ${selfError.message}`);
    }
    
    return selfPurchases || [];
  } catch (error: any) {
    console.error("Error in fetchSelfPurchases:", error);
    throw error;
  }
}

export async function fetchUserProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  
  try {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    
    if (usersError) {
      console.error("Error fetching user profiles:", usersError);
      throw new Error(`Error fetching user profiles: ${usersError.message}`);
    }
    
    return users || [];
  } catch (error: any) {
    console.error("Error in fetchUserProfiles:", error);
    throw error;
  }
}

export async function updateRequestStatusInDB(
  requestId: string, 
  requestType: 'buy_request' | 'self_purchase', 
  newStatus: string
) {
  const table = requestType === 'buy_request' ? 'buy_requests' : 'self_purchases';
  console.log(`Updating ${table} status for request ${requestId} to ${newStatus}`);
  
  // Update the request status
  const { error: requestError } = await supabase
    .from(table)
    .update({ status: newStatus })
    .eq('id', requestId);
  
  if (requestError) {
    console.error(`Error updating ${table}:`, requestError);
    throw requestError;
  }
  
  // Update the associated order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('reference_id', requestId);
  
  if (orderError) {
    console.error("Error updating order:", orderError);
    console.warn("Order status update failed, but request status was updated successfully");
  } else {
    console.log("Order status updated successfully");
  }
}

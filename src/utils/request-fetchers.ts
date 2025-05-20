
import { supabase } from "@/integrations/supabase/client";
import { formatBuyRequestsData, formatSelfPurchasesData } from "./request-formatters";

export async function fetchBuyRequests(statusFilter = 'all') {
  try {
    // Build query for buy requests
    let query = supabase
      .from('buy_requests')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `);
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    // Execute query
    const { data: buyRequests, error } = await query;
    
    if (error) throw error;
    
    // Format the data
    return formatBuyRequestsData(buyRequests || []);
  } catch (error) {
    console.error("Error fetching buy requests:", error);
    throw error;
  }
}

export async function fetchSelfPurchases(statusFilter = 'all') {
  try {
    // Build query for self purchases
    let query = supabase
      .from('self_purchases')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name
        )
      `);
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    // Execute query
    const { data: selfPurchases, error } = await query;
    
    if (error) throw error;
    
    // Format the data
    return formatSelfPurchasesData(selfPurchases || []);
  } catch (error) {
    console.error("Error fetching self purchases:", error);
    throw error;
  }
}

// Add the missing updateRequestStatusInDB function
export async function updateRequestStatusInDB(
  requestId: string,
  requestType: 'buy_request' | 'self_purchase',
  newStatus: string
) {
  try {
    const tableName = requestType === 'buy_request' ? 'buy_requests' : 'self_purchases';
    
    const { error } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq('id', requestId);
      
    if (error) throw error;
    
    // Also update the status in the orders table
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('reference_id', requestId);
      
    if (orderError) {
      console.warn('Failed to update order status:', orderError);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

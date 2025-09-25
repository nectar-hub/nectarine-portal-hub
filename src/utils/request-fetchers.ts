
import { supabase } from "@/integrations/supabase/client";
import { formatBuyRequests, formatSelfPurchases } from "./request-formatters";
import { Request, RequestItem } from "@/types/request";

export async function fetchBuyRequests(statusFilter = 'all') {
  try {
    console.log('[FETCH] Starting to fetch buy requests with filter:', statusFilter);
    
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
    
    console.log('[FETCH] Executing buy requests query...');
    
    // Execute query
    const { data: buyRequests, error } = await query;
    
    if (error) {
      console.error('[FETCH] Error fetching buy requests:', error);
      throw error;
    }
    
    console.log('[FETCH] Buy requests fetched successfully:', buyRequests?.length || 0, 'requests');
    
    // Once we have the buy requests, fetch all associated items
    const buyRequestIds = buyRequests?.map(req => req.id) || [];
    
    let buyRequestItems: Record<string, RequestItem[]> = {};
    
    if (buyRequestIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('buy_request_items')
        .select('*')
        .in('buy_request_id', buyRequestIds);
      
      if (itemsError) {
        console.error("Error fetching buy request items:", itemsError);
      } else if (items) {
        // Group items by buy_request_id
        buyRequestItems = items.reduce((acc, item) => {
          if (!acc[item.buy_request_id]) {
            acc[item.buy_request_id] = [];
          }
          acc[item.buy_request_id].push(item);
          return acc;
        }, {} as Record<string, RequestItem[]>);
      }
    }
    
    // Format the data with items included
    const formattedRequests = formatBuyRequests(buyRequests || [], buyRequestItems);
    console.log('[FETCH] Formatted buy requests:', formattedRequests.length, 'requests');
    
    return formattedRequests;
  } catch (error) {
    console.error("[FETCH] Error fetching buy requests:", error);
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
    return formatSelfPurchases(selfPurchases || []);
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

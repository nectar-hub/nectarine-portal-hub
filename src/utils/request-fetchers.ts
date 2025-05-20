
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

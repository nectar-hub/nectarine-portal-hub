
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestItem } from "@/types/request";
import { fetchBuyRequests, fetchSelfPurchases } from "@/utils/request-fetchers";
import { formatBuyRequestsData, formatSelfPurchasesData } from "@/utils/request-formatters";

export function useRequests(requestType: string = 'all', statusFilter: string = 'all') {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Function to fetch buy request items and associate them with their parent request
  const fetchBuyRequestItems = async (buyRequests: Request[]) => {
    if (!buyRequests.length) return buyRequests;
    
    // Get all buy request IDs
    const buyRequestIds = buyRequests.map(request => request.id);
    
    // Fetch all items for these buy requests in a single query
    const { data: items, error } = await supabase
      .from('buy_request_items')
      .select('*')
      .in('buy_request_id', buyRequestIds);
      
    if (error) {
      console.error('Error fetching buy request items:', error);
      return buyRequests; // Return original requests if items can't be fetched
    }
    
    if (!items || items.length === 0) return buyRequests;
    
    // Map items to their parent requests
    return buyRequests.map(request => {
      const requestItems = items.filter(item => item.buy_request_id === request.id);
      
      // If we found items for this request, add them to the request
      if (requestItems.length > 0) {
        return {
          ...request,
          items: requestItems as RequestItem[]
        };
      }
      
      return request;
    });
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchedRequests: Request[] = [];
      
      if (requestType === 'all' || requestType === 'buy_request') {
        const buyRequests = await fetchBuyRequests(statusFilter);
        
        // Fetch and associate items with buy requests
        const buyRequestsWithItems = await fetchBuyRequestItems(buyRequests);
        fetchedRequests = [...fetchedRequests, ...buyRequestsWithItems];
      }
      
      if (requestType === 'all' || requestType === 'self_purchase') {
        const selfPurchases = await fetchSelfPurchases(statusFilter);
        fetchedRequests = [...fetchedRequests, ...selfPurchases];
      }
      
      // Sort all requests by created_at date (newest first)
      fetchedRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setRequests(fetchedRequests);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestType, statusFilter]);
  
  const updateRequestStatus = async (
    requestId: string, 
    requestType: 'buy_request' | 'self_purchase', 
    newStatus: string
  ) => {
    setProcessingId(requestId);
    
    try {
      const tableName = requestType === 'buy_request' ? 'buy_requests' : 'self_purchases';
      
      // Update the status in the appropriate table
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
        // Don't throw error here - we still updated the main request
      }
      
      // Update local state
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: newStatus } 
            : request
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus}`,
      });
      
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  const deleteRequest = async (
    requestId: string, 
    requestType: 'buy_request' | 'self_purchase'
  ) => {
    if (!requestId) return;
    
    setProcessingId(requestId);
    
    try {
      const tableName = requestType === 'buy_request' ? 'buy_requests' : 'self_purchases';
      
      // Delete any associated items if it's a buy_request
      if (requestType === 'buy_request') {
        const { error: itemsError } = await supabase
          .from('buy_request_items')
          .delete()
          .eq('buy_request_id', requestId);
          
        if (itemsError) {
          console.warn('Error deleting associated items:', itemsError);
          // Continue with deletion anyway
        }
      }
      
      // Find and delete associated order first
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('reference_id', requestId)
        .single();
        
      if (order) {
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
          
        if (orderError) {
          console.warn('Error deleting associated order:', orderError);
          // Continue with main request deletion
        }
      }
      
      // Delete the main request
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Update local state
      setRequests(prev => prev.filter(request => request.id !== requestId));
      
      toast({
        title: "Request Deleted",
        description: "The request has been deleted successfully",
      });
      
    } catch (err: any) {
      console.error('Error deleting request:', err);
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    processingId,
    fetchRequests,
    updateRequestStatus,
    deleteRequest
  };
}

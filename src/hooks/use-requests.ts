
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Request, RequestItem } from "@/types/request";
import { fetchBuyRequests, fetchSelfPurchases, updateRequestStatusInDB } from "@/utils/request-fetchers";
import { formatBuyRequests, formatSelfPurchases } from "@/utils/request-formatters";

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
    console.log('[USE-REQUESTS] Starting fetch with requestType:', requestType, 'statusFilter:', statusFilter);
    setLoading(true);
    setError(null);
    
    try {
      let fetchedRequests: Request[] = [];
      
      if (requestType === 'all' || requestType === 'buy_request') {
        console.log('[USE-REQUESTS] Fetching buy requests...');
        const buyRequests = await fetchBuyRequests(statusFilter);
        console.log('[USE-REQUESTS] Buy requests fetched:', buyRequests.length);
        fetchedRequests = [...fetchedRequests, ...buyRequests];
      }
      
      if (requestType === 'all' || requestType === 'self_purchase') {
        console.log('[USE-REQUESTS] Fetching self purchases...');
        const selfPurchases = await fetchSelfPurchases(statusFilter);
        console.log('[USE-REQUESTS] Self purchases fetched:', selfPurchases.length);
        fetchedRequests = [...fetchedRequests, ...selfPurchases];
      }
      
      // Sort all requests by created_at date (newest first)
      fetchedRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      console.log('[USE-REQUESTS] Final requests count:', fetchedRequests.length);
      setRequests(fetchedRequests);
    } catch (err) {
      console.error('[USE-REQUESTS] Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [requestType, statusFilter]);

  // Real-time subscription effect
  useEffect(() => {
    let buyRequestsChannel: any;
    let selfPurchasesChannel: any;
    let buyRequestItemsChannel: any;

    const setupRealtimeSubscriptions = () => {
      console.log('[REALTIME] Setting up subscriptions for requestType:', requestType);

      // Subscribe to buy_requests changes
      if (requestType === 'all' || requestType === 'buy_request') {
        buyRequestsChannel = supabase
          .channel('buy_requests_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'buy_requests'
            },
            (payload) => {
              console.log('[REALTIME] Buy request change detected:', payload);
              // Refetch data to get the latest state
              fetchRequests();
            }
          )
          .subscribe();

        // Subscribe to buy_request_items changes
        buyRequestItemsChannel = supabase
          .channel('buy_request_items_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'buy_request_items'
            },
            (payload) => {
              console.log('[REALTIME] Buy request item change detected:', payload);
              // Refetch data to get the latest state
              fetchRequests();
            }
          )
          .subscribe();
      }

      // Subscribe to self_purchases changes
      if (requestType === 'all' || requestType === 'self_purchase') {
        selfPurchasesChannel = supabase
          .channel('self_purchases_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'self_purchases'
            },
            (payload) => {
              console.log('[REALTIME] Self purchase change detected:', payload);
              // Refetch data to get the latest state
              fetchRequests();
            }
          )
          .subscribe();
      }
    };

    setupRealtimeSubscriptions();

    // Cleanup subscriptions on unmount or when requestType changes
    return () => {
      if (buyRequestsChannel) {
        supabase.removeChannel(buyRequestsChannel);
      }
      if (selfPurchasesChannel) {
        supabase.removeChannel(selfPurchasesChannel);
      }
      if (buyRequestItemsChannel) {
        supabase.removeChannel(buyRequestItemsChannel);
      }
    };
  }, [requestType, fetchRequests]);
  
  const updateRequestStatus = async (
    requestId: string, 
    requestType: 'buy_request' | 'self_purchase', 
    newStatus: string
  ) => {
    setProcessingId(requestId);
    
    try {
      await updateRequestStatusInDB(requestId, requestType, newStatus);
      
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

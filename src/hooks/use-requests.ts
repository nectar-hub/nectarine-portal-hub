
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Request } from "@/types/request";

export function useRequests(requestType?: string, filter: string = "all") {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isBuyRequestsPage = requestType === 'buy_requests';
  const isSelfPurchasesPage = requestType === 'self_purchases';
  
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine which type of requests to fetch based on the current route
      const shouldFetchBuyRequests = !isSelfPurchasesPage || requestType === undefined;
      const shouldFetchSelfPurchases = !isBuyRequestsPage || requestType === undefined;
      
      console.log("Fetching requests:", { 
        type: requestType,
        fetchBuy: shouldFetchBuyRequests,
        fetchSelf: shouldFetchSelfPurchases
      });
      
      let buyRequestsFormatted: Request[] = [];
      let selfPurchasesFormatted: Request[] = [];
      
      // Fetch buy requests if needed
      if (shouldFetchBuyRequests) {
        // Create a query based on the filter
        let buyRequestsQuery = supabase
          .from('buy_requests')
          .select(`
            id, user_id, product_name, store_name, quantity, product_price, 
            country_of_purchase, status, created_at
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
        
        buyRequestsFormatted = (buyRequests || []).map(req => ({
          id: req.id,
          user_id: req.user_id,
          request_type: 'buy_request' as const,
          product_name: req.product_name,
          store_name: req.store_name || 'Unknown',
          quantity: req.quantity,
          price: req.product_price,
          status: req.status,
          created_at: req.created_at,
          country: req.country_of_purchase
        }));
      }
      
      // Fetch self purchases if needed
      if (shouldFetchSelfPurchases) {
        // Create a query based on the filter
        let selfPurchasesQuery = supabase
          .from('self_purchases')
          .select(`
            id, user_id, description, store_name, quantity, estimated_value, 
            status, created_at
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
        
        selfPurchasesFormatted = (selfPurchases || []).map(purchase => ({
          id: purchase.id,
          user_id: purchase.user_id,
          request_type: 'self_purchase' as const,
          product_name: purchase.description,
          store_name: purchase.store_name,
          quantity: purchase.quantity,
          price: purchase.estimated_value,
          status: purchase.status,
          created_at: purchase.created_at
        }));
      }
      
      // Filter requests based on the current page
      let combinedRequests: Request[] = [];
      if (isBuyRequestsPage) {
        combinedRequests = buyRequestsFormatted;
      } else if (isSelfPurchasesPage) {
        combinedRequests = selfPurchasesFormatted;
      } else {
        combinedRequests = [...buyRequestsFormatted, ...selfPurchasesFormatted];
      }
      
      // Fetch user details for each request if there are any requests
      if (combinedRequests.length > 0) {
        const userIds = [...new Set(combinedRequests.map(req => req.user_id))];
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        if (usersError) {
          console.error("Error fetching user profiles:", usersError);
          throw new Error(`Error fetching user profiles: ${usersError.message}`);
        }
        
        // Map user details to requests
        const requestsWithUserDetails = combinedRequests.map(req => {
          const user = users?.find(u => u.id === req.user_id);
          return {
            ...req,
            user_email: user?.email || 'Unknown',
            user_name: user?.full_name || 'Unknown'
          };
        });
        
        // Sort by created_at
        requestsWithUserDetails.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setRequests(requestsWithUserDetails);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error("Error in fetchRequests:", error);
      setError(error.message || "Failed to load requests");
      toast({
        title: "Error",
        description: error.message || "Failed to load requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => {
    try {
      setProcessingId(requestId);
      
      const table = requestType === 'buy_request' ? 'buy_requests' : 'self_purchases';
      
      // Update the request status
      const { error: requestError } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', requestId);
      
      if (requestError) throw requestError;
      
      // Update the associated order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('reference_id', requestId);
      
      if (orderError) throw orderError;
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      
      toast({
        title: "Status Updated",
        description: `Request marked as ${newStatus}`,
      });
      
    } catch (error: any) {
      console.error("Error updating request status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the request status",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter, requestType]);

  return {
    requests,
    loading,
    error,
    processingId,
    fetchRequests,
    updateRequestStatus
  };
}


import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Request } from "@/types/request";
import { useRequestStatus } from "@/hooks/use-request-status";
import { 
  fetchBuyRequests,
  fetchBuyRequestItems,
  fetchSelfPurchases,
  fetchUserProfiles 
} from "@/utils/request-fetchers";
import {
  formatBuyRequests,
  formatSelfPurchases,
  addUserDetailsToRequests,
  sortRequestsByDate
} from "@/utils/request-formatters";

export function useRequests(requestType?: string, filter: string = "all") {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { processingId, updateRequestStatus } = useRequestStatus();

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
        filter: filter,
        fetchBuy: shouldFetchBuyRequests,
        fetchSelf: shouldFetchSelfPurchases
      });
      
      let buyRequestsFormatted: Request[] = [];
      let selfPurchasesFormatted: Request[] = [];
      
      // Fetch buy requests if needed
      if (shouldFetchBuyRequests) {
        try {
          const buyRequests = await fetchBuyRequests(filter);
          
          // Always fetch items for buy requests, even if there are none
          if (buyRequests.length > 0) {
            const buyRequestIds = buyRequests.map(req => req.id);
            const buyRequestItems = await fetchBuyRequestItems(buyRequestIds);
            console.log("Fetched items for buy requests:", buyRequestItems);
            buyRequestsFormatted = formatBuyRequests(buyRequests, buyRequestItems);
          }
          
          console.log(`Fetched ${buyRequestsFormatted.length} buy requests`);
        } catch (buyErr: any) {
          console.error("Error processing buy requests:", buyErr);
          // Continue to try fetching self-purchases even if buy requests fail
        }
      }
      
      // Fetch self purchases if needed
      if (shouldFetchSelfPurchases) {
        try {
          const selfPurchases = await fetchSelfPurchases(filter);
          selfPurchasesFormatted = formatSelfPurchases(selfPurchases);
          
          console.log(`Fetched ${selfPurchasesFormatted.length} self purchases`);
        } catch (selfErr: any) {
          console.error("Error processing self purchases:", selfErr);
          // Continue with whatever data we have
        }
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
      
      console.log(`Combined ${combinedRequests.length} total requests`);
      
      // Fetch user details for each request if there are any requests
      if (combinedRequests.length > 0) {
        try {
          const userIds = [...new Set(combinedRequests.map(req => req.user_id))];
          console.log(`Fetching details for ${userIds.length} unique users`);
          
          const users = await fetchUserProfiles(userIds);
          
          // Map user details to requests and sort by date
          const requestsWithUserDetails = addUserDetailsToRequests(combinedRequests, users);
          const sortedRequests = sortRequestsByDate(requestsWithUserDetails);
          
          // Log full data for debugging
          console.log("Final formatted requests:", sortedRequests);
          
          setRequests(sortedRequests);
        } catch (userError: any) {
          console.error("Error processing user details:", userError);
          // Still set the requests even if user details fail
          setRequests(combinedRequests);
        }
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

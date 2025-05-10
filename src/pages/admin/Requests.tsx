
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Check, X, AlertCircle } from "lucide-react";

type Request = {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  request_type: 'buy_request' | 'self_purchase';
  product_name: string;
  store_name: string;
  quantity: number;
  price?: number;
  status: string;
  created_at: string;
  country?: string;
};

const Requests = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentPath = location.pathname;
  const isBuyRequestsPage = currentPath.includes('/buy-requests');
  const isSelfPurchasesPage = currentPath.includes('/self-purchases');

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, filter, currentPath]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine which type of requests to fetch based on the current route
      const shouldFetchBuyRequests = !isSelfPurchasesPage || currentPath === '/admin/requests';
      const shouldFetchSelfPurchases = !isBuyRequestsPage || currentPath === '/admin/requests';
      
      console.log("Fetching requests:", { 
        path: currentPath,
        fetchBuy: shouldFetchBuyRequests,
        fetchSelf: shouldFetchSelfPurchases
      });
      
      let buyRequestsFormatted: Request[] = [];
      let selfPurchasesFormatted: Request[] = [];
      
      // Fetch buy requests if needed
      if (shouldFetchBuyRequests) {
        const { data: buyRequests, error: buyError } = await supabase
          .from('buy_requests')
          .select(`
            id, user_id, product_name, store_name, quantity, product_price, 
            country_of_purchase, status, created_at
          `)
          .eq(filter !== 'all' ? 'status' : 'id', filter !== 'all' ? filter : 'id');
        
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
        const { data: selfPurchases, error: selfError } = await supabase
          .from('self_purchases')
          .select(`
            id, user_id, description, store_name, quantity, estimated_value, 
            status, created_at
          `)
          .eq(filter !== 'all' ? 'status' : 'id', filter !== 'all' ? filter : 'id');
        
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

  const getPageTitle = () => {
    if (isBuyRequestsPage) return "Buy For Me Requests";
    if (isSelfPurchasesPage) return "Self Purchases";
    return "Purchase Requests";
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 text-lg text-center max-w-md">
            You don't have permission to view this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
          <p className="text-muted-foreground mt-1">
            {isBuyRequestsPage 
              ? "Review and manage customer buy for me requests"
              : isSelfPurchasesPage
              ? "Review and manage self-purchase requests"
              : "Review and manage all customer purchase requests"}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filter by status:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Requests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchRequests} 
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nectarine-500"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button variant="outline" onClick={fetchRequests}>
                  Try Again
                </Button>
              </div>
            ) : requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isBuyRequestsPage && !isSelfPurchasesPage && (
                      <TableHead>Type</TableHead>
                    )}
                    <TableHead>User</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      {!isBuyRequestsPage && !isSelfPurchasesPage && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {request.request_type === 'buy_request' ? (
                              <ShoppingCart className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Package className="h-4 w-4 text-green-500" />
                            )}
                            <span>
                              {request.request_type === 'buy_request' ? 'Buy Request' : 'Self Purchase'}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user_name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{request.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        <span title={request.product_name}>
                          {request.product_name}
                        </span>
                      </TableCell>
                      <TableCell>{request.store_name}</TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        {request.price ? `$${request.price.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          request.status === 'completed' ? 'default' :
                          request.status === 'pending' ? 'outline' :
                          request.status === 'in_transit' ? 'secondary' :
                          request.status === 'processing' ? 'default' :
                          'destructive'
                        }>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, request.request_type, 'processing')}
                                disabled={processingId === request.id}
                              >
                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestStatus(request.id, request.request_type, 'cancelled')}
                                disabled={processingId === request.id}
                              >
                                <X className="h-4 w-4 text-red-500 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'processing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, request.request_type, 'in_transit')}
                              disabled={processingId === request.id}
                            >
                              <Package className="h-4 w-4 text-blue-500 mr-1" />
                              Ship
                            </Button>
                          )}
                          {request.status === 'in_transit' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, request.request_type, 'completed')}
                              disabled={processingId === request.id}
                            >
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-6">
                  There are no requests that match your current filter.
                </p>
                {filter !== 'all' && (
                  <Button variant="outline" onClick={() => setFilter("all")}>
                    Show All Requests
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Requests;

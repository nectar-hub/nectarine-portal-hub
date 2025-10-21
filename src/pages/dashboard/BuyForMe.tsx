
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { BuyRequestForm } from "@/components/forms/BuyRequestForm";
import { BuyRequestDetailsDialog } from "@/components/dashboard/BuyRequestDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, Store } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BuyRequest {
  id: string;
  product_name: string;
  product_url?: string;
  store_name?: string;
  quantity: number;
  product_price?: number;
  color?: string;
  size?: string;
  country_of_purchase: string;
  delivery_deadline?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  status_updated_at?: string;
  admin_notes?: string;
  items?: Array<{
    id: string;
    product_name: string;
    product_url?: string;
    store_name?: string;
    quantity: number;
    price?: number;
    color?: string;
    size?: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'approved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'purchased':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'shipped':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const BuyForMe = () => {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<BuyRequest | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BuyRequest | null>(null);

  const { data: buyRequests, refetch } = useQuery({
    queryKey: ['buy_requests'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('buy_requests')
        .select(`
          id,
          product_name,
          product_url,
          store_name,
          quantity,
          product_price,
          color,
          size,
          country_of_purchase,
          delivery_deadline,
          notes,
          status,
          created_at,
          updated_at,
          status_updated_at,
          items:buy_request_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Set up real-time subscriptions for buy requests
  useEffect(() => {
    if (!user) return;

    console.log('[CLIENT REALTIME] Setting up buy requests subscription');
    
    const buyRequestsChannel = supabase
      .channel('user_buy_requests_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buy_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[CLIENT REALTIME] Buy request change detected:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buyRequestsChannel);
    };
  }, [user, refetch]);

  const handleRequestClick = (request: BuyRequest) => {
    console.log('[UI] Buy request clicked:', request.id, request);
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleEditRequest = (request: BuyRequest) => {
    setEditingRequest(request);
    setIsDetailsDialogOpen(false);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditComplete = () => {
    setEditingRequest(null);
    refetch();
    toast({
      title: "Success",
      description: "Your request has been updated"
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {editingRequest ? "Edit Buy Request" : "Buy For Me Request"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editingRequest 
              ? "Update your request details below. You can modify items, quantities, and other information."
              : "Fill in the form below to request us to purchase items for you. You can add multiple items to a single order."
            }
          </p>
          {editingRequest && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Editing request: {editingRequest.product_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRequest(null)}
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
              >
                Cancel Edit
              </Button>
            </div>
          )}
        </div>

        <BuyRequestForm 
          editingRequest={editingRequest || undefined} 
          onEditComplete={handleEditComplete}
        />

        {/* Recent Buy Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-nectarine-600" />
              Recent Buy Requests
            </CardTitle>
            <CardDescription>Your latest purchase requests</CardDescription>
          </CardHeader>
          <CardContent>
            {buyRequests && buyRequests.length > 0 ? (
              <div className="space-y-3">
                {buyRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleRequestClick(request)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{request.product_name}</h4>
                        {request.store_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Store className="h-3 w-3" />
                            {request.store_name}
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Qty: {request.quantity}</span>
                      {request.product_price && <span>${request.product_price}</span>}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-muted-foreground">No buy requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your first request using the form above
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BuyRequestDetailsDialog
        request={selectedRequest}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          console.log('[UI] Buy request details dialog open change:', open);
          setIsDetailsDialogOpen(open);
          if (!open) setSelectedRequest(null);
        }}
        onEdit={handleEditRequest}
      />
    </DashboardLayout>
  );
};

export default BuyForMe;

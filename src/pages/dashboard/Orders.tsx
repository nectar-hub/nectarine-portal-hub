
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { OrderFilters } from "@/components/dashboard/OrderFilters";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { OrdersEmptyState } from "@/components/dashboard/OrdersEmptyState";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

type Order = {
  id: string;
  order_type: 'buy_request' | 'self_purchase';
  status: string;
  created_at: string;
  updated_at: string;
  details: {
    product_name?: string;
    tracking_number?: string;
    store_name: string;
    country_of_purchase?: string;
    quantity: number;
    price?: number;
  }
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        // First, fetch the orders
        let query = supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id);
          
        if (orderType !== 'all') {
          query = query.eq('order_type', orderType);
        }
        
        if (status !== 'all') {
          query = query.eq('status', status);
        }
        
        query = query.order('created_at', { ascending: false });
        
        const { data: orderData, error: orderError } = await query;
        
        if (orderError) throw orderError;
        
        if (orderData) {
          // For each order, fetch the details based on the order type and reference_id
          const ordersWithDetails = await Promise.all(
            orderData.map(async (order) => {
              let details = {} as Order['details'];
              
              if (order.order_type === 'buy_request') {
                const { data, error } = await supabase
                  .from('buy_requests')
                  .select('product_name, store_name, country_of_purchase, quantity, product_price')
                  .eq('id', order.reference_id)
                  .single();
                
                if (!error && data) {
                  details = {
                    product_name: data.product_name,
                    store_name: data.store_name || '',
                    country_of_purchase: data.country_of_purchase,
                    quantity: data.quantity,
                    price: data.product_price || 0
                  };
                }
              } else if (order.order_type === 'self_purchase') {
                const { data, error } = await supabase
                  .from('self_purchases')
                  .select('tracking_number, store_name, quantity, estimated_value, description')
                  .eq('id', order.reference_id)
                  .single();
                  
                if (!error && data) {
                  details = {
                    tracking_number: data.tracking_number,
                    store_name: data.store_name,
                    quantity: data.quantity,
                    price: data.estimated_value || 0,
                    product_name: data.description
                  };
                }
              }
              
              return {
                ...order,
                order_type: order.order_type as 'buy_request' | 'self_purchase',
                details
              } as Order;
            })
          );
          
          setOrders(ordersWithDetails);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, orderType, status]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your purchase and shipping requests
          </p>
        </div>

        <OrderFilters 
          orderType={orderType}
          status={status}
          onOrderTypeChange={setOrderType}
          onStatusChange={setStatus}
        />

        {loading ? (
          <LoadingSpinner />
        ) : orders.length > 0 ? (
          <OrdersTable orders={orders} />
        ) : (
          <OrdersEmptyState />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;

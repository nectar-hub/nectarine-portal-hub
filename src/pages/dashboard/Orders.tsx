import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShoppingBag,
  Package,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

const OrderStatusBadge = ({ status }: { status: string }) => {
  let colorClass;
  
  switch (status) {
    case 'completed':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'in_transit':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'processing':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'cancelled':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'pending':
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
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

  // Mock orders for development if API returns no data
  const mockOrders: Order[] = [
    {
      id: "1",
      order_type: 'buy_request',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      details: {
        product_name: 'iPhone 15 Pro',
        store_name: 'Apple',
        country_of_purchase: 'usa',
        quantity: 1,
        price: 999.99
      }
    },
    {
      id: "2",
      order_type: 'self_purchase',
      status: 'in_transit',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        tracking_number: 'USPS12345678',
        store_name: 'Nike',
        quantity: 2,
        price: 120,
        product_name: 'Air Force 1 Shoes'
      }
    },
    {
      id: "3",
      order_type: 'buy_request',
      status: 'completed',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        product_name: 'MacBook Air M3',
        store_name: 'Best Buy',
        country_of_purchase: 'usa',
        quantity: 1,
        price: 1499.99
      }
    }
  ];

  // Use mock orders if the API returned no orders
  const displayOrders = orders.length > 0 ? orders : mockOrders;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your purchase and shipping requests
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Order Type:</span>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="buy_request">Buy For Me</SelectItem>
                  <SelectItem value="self_purchase">Self Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button 
              className="nectarine-gradient hover:opacity-90 transition-opacity"
              size="sm"
              asChild
            >
              <a href="/dashboard/buy-for-me">New Buy Request</a>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nectarine-500"></div>
          </div>
        ) : displayOrders.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product/Tracking</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.split('-')[0]}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.order_type === 'buy_request' ? (
                            <ShoppingBag className="h-4 w-4 text-nectarine-500" />
                          ) : (
                            <Package className="h-4 w-4 text-nectarine-500" />
                          )}
                          <span>
                            {order.order_type === 'buy_request' ? 'Buy For Me' : 'Self Purchase'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.order_type === 'buy_request' 
                          ? order.details.product_name 
                          : order.details.tracking_number}
                      </TableCell>
                      <TableCell>{order.details.store_name}</TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any orders yet that match your selected filters.
              </p>
              <Button 
                className="nectarine-gradient hover:opacity-90 transition-opacity"
                asChild
              >
                <a href="/dashboard/buy-for-me">Create Your First Order</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;

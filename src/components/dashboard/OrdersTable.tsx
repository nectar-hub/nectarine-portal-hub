
import { format } from "date-fns";
import { ShoppingBag, Package, ArrowRight } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface Order {
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
}

interface OrdersTableProps {
  orders: Order[];
}

export const OrdersTable = ({ orders }: OrdersTableProps) => {
  return (
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
            {orders.map((order) => (
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
  );
};

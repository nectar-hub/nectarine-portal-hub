import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Calendar, FileText, Package, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  order_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  reference_id: string;
  details?: {
    product_name?: string;
    store_name?: string;
    quantity?: number;
    tracking_number?: string;
    product_type?: string;
  };
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'shipped':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getOrderTypeLabel = (orderType: string) => {
  switch (orderType) {
    case 'buy_request':
      return 'Buy Request';
    case 'self_purchase':
      return 'Self Purchase';
    default:
      return orderType.charAt(0).toUpperCase() + orderType.slice(1);
  }
};

const getOrderTypeIcon = (orderType: string) => {
  switch (orderType) {
    case 'buy_request':
      return ShoppingCart;
    case 'self_purchase':
      return Package;
    default:
      return ClipboardList;
  }
};

export const OrderDetailsDialog = ({
  order,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  const OrderIcon = getOrderTypeIcon(order.order_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <OrderIcon className="h-5 w-5" />
                    {getOrderTypeLabel(order.order_type)}
                  </h3>
                  <p className="text-muted-foreground text-sm">Order ID: {order.id}</p>
                  <p className="text-muted-foreground text-sm">Reference: {order.reference_id}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>

              {/* Order Details */}
              {order.details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.details.product_name && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Product</p>
                      <p className="text-sm text-muted-foreground">{order.details.product_name}</p>
                    </div>
                  )}

                  {order.details.product_type && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Product Type</p>
                      <p className="text-sm text-muted-foreground">{order.details.product_type}</p>
                    </div>
                  )}

                  {order.details.store_name && (
                    <div>
                      <p className="text-sm font-medium">Store</p>
                      <p className="text-sm text-muted-foreground">{order.details.store_name}</p>
                    </div>
                  )}

                  {order.details.quantity && (
                    <div>
                      <p className="text-sm font-medium">Quantity</p>
                      <p className="text-sm text-muted-foreground">
                        {order.details.quantity} {order.details.quantity > 1 ? 'items' : 'item'}
                      </p>
                    </div>
                  )}

                  {order.details.tracking_number && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Tracking Number</p>
                      <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                        {order.details.tracking_number}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">Order Type</p>
                    <p className="text-sm text-muted-foreground">{getOrderTypeLabel(order.order_type)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Order Timeline
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Order Created</span>
                  <span>{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(order.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current Status</span>
                  <Badge variant="outline" className="text-xs">
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Type Information */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Order Information
              </h4>
              
              <div className="text-sm text-muted-foreground">
                {order.order_type === 'buy_request' ? (
                  <p>This order represents a buy request where we purchase items on your behalf from various international stores.</p>
                ) : order.order_type === 'self_purchase' ? (
                  <p>This order represents items you purchased yourself that we will help ship to your destination.</p>
                ) : (
                  <p>This is a general order in our system.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
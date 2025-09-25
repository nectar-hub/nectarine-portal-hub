import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package, Store, Truck, Calendar, FileText, DollarSign, Hash } from "lucide-react";
import { format } from "date-fns";

interface SelfPurchase {
  id: string;
  product_type: string;
  description: string;
  store_name: string;
  quantity: number;
  estimated_value: number | null;
  tracking_number: string;
  courier: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  status_updated_at: string | null;
}

interface SelfPurchaseDetailsDialogProps {
  purchase: SelfPurchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'received':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_transit':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'arrived':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'collected':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in_transit':
      return 'In Transit';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const SelfPurchaseDetailsDialog = ({
  purchase,
  open,
  onOpenChange,
}: SelfPurchaseDetailsDialogProps) => {
  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Self Purchase Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{purchase.product_type}</h3>
                  <p className="text-muted-foreground text-sm">ID: {purchase.id}</p>
                </div>
                <Badge className={getStatusColor(purchase.status)}>
                  {getStatusLabel(purchase.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Store</p>
                    <p className="text-sm text-muted-foreground">{purchase.store_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <p className="text-sm text-muted-foreground">{purchase.quantity} {purchase.quantity > 1 ? 'items' : 'item'}</p>
                  </div>
                </div>

                {purchase.estimated_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Estimated Value</p>
                      <p className="text-sm text-muted-foreground">${purchase.estimated_value}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(purchase.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Shipping Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Tracking Number</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                    {purchase.tracking_number}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Courier</p>
                  <p className="text-sm text-muted-foreground">{purchase.courier}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {purchase.notes && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Additional Notes
                </h4>
                <p className="text-sm text-muted-foreground">{purchase.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Timeline
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(purchase.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                
                {purchase.status_updated_at && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status Updated</span>
                    <span>{format(new Date(purchase.status_updated_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span>{format(new Date(purchase.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
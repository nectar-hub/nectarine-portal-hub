import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Store, Globe, Calendar, FileText, DollarSign, Hash, Palette, Ruler, ExternalLink, Edit } from "lucide-react";
import { format } from "date-fns";

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

interface BuyRequestDetailsDialogProps {
  request: BuyRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (request: BuyRequest) => void;
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

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const BuyRequestDetailsDialog = ({
  request,
  open,
  onOpenChange,
  onEdit,
}: BuyRequestDetailsDialogProps) => {
  if (!request) return null;

  const canEdit = request.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Buy Request Details
            </DialogTitle>
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(request)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Request
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{request.product_name}</h3>
                  <p className="text-muted-foreground text-sm">ID: {request.id}</p>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.store_name && (
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Store</p>
                      <p className="text-sm text-muted-foreground">{request.store_name}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <p className="text-sm text-muted-foreground">{request.quantity} {request.quantity > 1 ? 'items' : 'item'}</p>
                  </div>
                </div>

                {request.product_price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Price</p>
                      <p className="text-sm text-muted-foreground">${request.product_price}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Country of Purchase</p>
                    <p className="text-sm text-muted-foreground">{request.country_of_purchase}</p>
                  </div>
                </div>

                {request.color && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Color</p>
                      <p className="text-sm text-muted-foreground">{request.color}</p>
                    </div>
                  </div>
                )}

                {request.size && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Size</p>
                      <p className="text-sm text-muted-foreground">{request.size}</p>
                    </div>
                  </div>
                )}

                {request.delivery_deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Delivery Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.delivery_deadline), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product URL */}
          {request.product_url && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Product Link
                </h4>
                <a 
                  href={request.product_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all text-sm"
                >
                  {request.product_url}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {request.notes && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Your Notes
                </h4>
                <p className="text-sm text-muted-foreground">{request.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes - Communication from Admin */}
          {request.admin_notes && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Message from Admin
                </h4>
                <div className="bg-background p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{request.admin_notes}</p>
                </div>
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
                  <span>{format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                
                {request.status_updated_at && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status Updated</span>
                    <span>{format(new Date(request.status_updated_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span>{format(new Date(request.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
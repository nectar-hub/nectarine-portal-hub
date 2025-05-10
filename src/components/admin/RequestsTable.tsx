
import { Request } from "@/types/request";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Check, X } from "lucide-react";

interface RequestsTableProps {
  requests: Request[];
  showType?: boolean;
  processingId: string | null;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
}

const RequestsTable = ({ requests, showType = false, processingId, onUpdateStatus }: RequestsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showType && <TableHead>Type</TableHead>}
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
            {showType && (
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
                      onClick={() => onUpdateStatus(request.id, request.request_type, 'processing')}
                      disabled={processingId === request.id}
                    >
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateStatus(request.id, request.request_type, 'cancelled')}
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
                    onClick={() => onUpdateStatus(request.id, request.request_type, 'in_transit')}
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
                    onClick={() => onUpdateStatus(request.id, request.request_type, 'completed')}
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
  );
};

export default RequestsTable;


import { Request } from "@/types/request";
import { TableRow, TableCell } from "@/components/ui/table";
import { ShoppingCart, Package, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import RequestActions from "./RequestActions";

interface RequestRowProps {
  request: Request;
  showType?: boolean;
  processingId: string | null;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
  onViewDetails: (request: Request) => void;
  onDeleteRequest?: (requestId: string, requestType: 'buy_request' | 'self_purchase') => void;
}

const RequestRow = ({ 
  request, 
  showType = false,
  processingId,
  onUpdateStatus,
  onViewDetails,
  onDeleteRequest
}: RequestRowProps) => {
  return (
    <TableRow
      key={request.id}
      className="cursor-pointer hover:bg-secondary/20"
      onClick={() => onViewDetails(request)}
    >
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
        <StatusBadge status={request.status} />
      </TableCell>
      <TableCell>
        {new Date(request.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end space-x-2">
          <RequestActions
            request={request}
            processingId={processingId}
            onUpdate={onUpdateStatus}
            onDelete={onDeleteRequest}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(request);
            }}
          >
            <Info className="h-4 w-4 text-blue-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RequestRow;

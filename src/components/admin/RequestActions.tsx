
import { Button } from "@/components/ui/button";
import { Check, X, Package } from "lucide-react";
import { Request } from "@/types/request";

interface RequestActionsProps {
  request: Request;
  processingId: string | null;
  onUpdate: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
  onClose?: () => void;
}

const RequestActions = ({ request, processingId, onUpdate, onClose }: RequestActionsProps) => {
  const handleUpdateStatus = (newStatus: string) => {
    onUpdate(request.id, request.request_type, newStatus);
    if (onClose) onClose();
  };

  if (request.status === 'pending') {
    return (
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateStatus('processing')}
          disabled={processingId === request.id}
        >
          <Check className="h-4 w-4 text-green-500 mr-1" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateStatus('cancelled')}
          disabled={processingId === request.id}
        >
          <X className="h-4 w-4 text-red-500 mr-1" />
          Reject
        </Button>
      </div>
    );
  }
  
  if (request.status === 'processing') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleUpdateStatus('in_transit')}
        disabled={processingId === request.id}
      >
        <Package className="h-4 w-4 text-blue-500 mr-1" />
        Ship
      </Button>
    );
  }
  
  if (request.status === 'in_transit') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleUpdateStatus('completed')}
        disabled={processingId === request.id}
      >
        <Check className="h-4 w-4 text-green-500 mr-1" />
        Complete
      </Button>
    );
  }
  
  return null;
};

export default RequestActions;

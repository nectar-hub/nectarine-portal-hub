
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Package, Trash2 } from "lucide-react";
import { Request } from "@/types/request";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RequestActionsProps {
  request: Request;
  processingId: string | null;
  onUpdate: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
  onDelete?: (requestId: string, requestType: 'buy_request' | 'self_purchase') => void;
  onClose?: () => void;
}

const RequestActions = ({ request, processingId, onUpdate, onDelete, onClose }: RequestActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleUpdateStatus = (newStatus: string) => {
    onUpdate(request.id, request.request_type, newStatus);
    if (onClose) onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(request.id, request.request_type);
      if (onClose) onClose();
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="space-x-2">
        {/* Self Purchase Status Flow */}
        {request.request_type === 'self_purchase' && (
          <>
            {request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('received')}
                disabled={processingId === request.id}
              >
                <Check className="h-4 w-4 text-green-500 mr-1" />
                Mark Received
              </Button>
            )}
            
            {request.status === 'received' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('in_transit')}
                disabled={processingId === request.id}
              >
                <Package className="h-4 w-4 text-blue-500 mr-1" />
                In Transit
              </Button>
            )}
            
            {request.status === 'in_transit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('arrived')}
                disabled={processingId === request.id}
              >
                <Package className="h-4 w-4 text-orange-500 mr-1" />
                Mark Arrived
              </Button>
            )}
            
            {request.status === 'arrived' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('collected')}
                disabled={processingId === request.id}
              >
                <Check className="h-4 w-4 text-green-500 mr-1" />
                Mark Collected
              </Button>
            )}
          </>
        )}

        {/* Buy Request Status Flow */}
        {request.request_type === 'buy_request' && (
          <>
            {request.status === 'pending' && (
              <>
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
              </>
            )}
            
            {request.status === 'processing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus('in_transit')}
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
                onClick={() => handleUpdateStatus('completed')}
                disabled={processingId === request.id}
              >
                <Check className="h-4 w-4 text-green-500 mr-1" />
                Complete
              </Button>
            )}
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={processingId === request.id}
        >
          <Trash2 className="h-4 w-4 text-red-500 mr-1" />
          Delete
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600" 
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RequestActions;

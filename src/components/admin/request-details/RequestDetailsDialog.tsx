
import { Request } from "@/types/request";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RequestHeader } from "./RequestHeader";
import { RequestProductInfo } from "./RequestProductInfo";
import { RequestNotes } from "./RequestNotes";
import { RequestMedia } from "./RequestMedia";
import RequestActions from "../RequestActions";

interface RequestDetailsDialogProps {
  request: Request | null;
  processingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
  onDeleteRequest?: (requestId: string, requestType: 'buy_request' | 'self_purchase') => void;
}

const RequestDetailsDialog = ({
  request,
  processingId,
  open,
  onOpenChange,
  onUpdateStatus,
  onDeleteRequest
}: RequestDetailsDialogProps) => {
  if (!request) return null;

  // Debug the request object to see what's coming in
  console.log("Request details dialog received request:", request);
  console.log("Request items:", request.items);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            Details for request #{request.id?.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Request Header Section */}
          <RequestHeader request={request} />
          
          {/* Product Information Section */}
          <RequestProductInfo request={request} />
          
          {/* Notes Section */}
          <RequestNotes notes={request.notes} />
          
          {/* Media Section */}
          <RequestMedia 
            requestType={request.request_type} 
            screenshotUrl={request.screenshot_url} 
            invoiceUrl={request.invoice_url} 
          />
          
          {/* Actions Section */}
          <div className="border-t pt-4 flex justify-between items-center">
            <h3 className="text-sm font-medium">Actions</h3>
            <RequestActions 
              request={request}
              processingId={processingId}
              onUpdate={onUpdateStatus}
              onDelete={onDeleteRequest}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsDialog;


import { useState, useEffect } from "react";
import { Request } from "@/types/request";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RequestHeader } from "./RequestHeader";
import { RequestProductInfo } from "./RequestProductInfo";
import { RequestNotes } from "./RequestNotes";
import { RequestMedia } from "./RequestMedia";
import { AdminNotes } from "./AdminNotes";
import { StatusUpdateInfo } from "./StatusUpdateInfo";
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
  const [currentRequest, setCurrentRequest] = useState(request);

  // Update current request when prop changes
  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  const handleNotesUpdated = (newNotes: string) => {
    if (currentRequest) {
      setCurrentRequest({
        ...currentRequest,
        admin_notes: newNotes
      });
    }
  };
  if (!currentRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <RequestHeader request={currentRequest} />
          
          <RequestProductInfo request={currentRequest} />
          
          {currentRequest.notes && <RequestNotes notes={currentRequest.notes} />}
          
          <AdminNotes 
            requestId={currentRequest.id}
            requestType={currentRequest.request_type}
            adminNotes={currentRequest.admin_notes}
            onNotesUpdated={handleNotesUpdated}
          />
          <StatusUpdateInfo 
            status={currentRequest.status}
            statusUpdatedAt={currentRequest.status_updated_at}
            statusUpdatedBy={currentRequest.status_updated_by}
          />
          
          <RequestMedia 
            requestType={currentRequest.request_type}
            screenshotUrl={currentRequest.screenshot_url}
            invoiceUrl={currentRequest.invoice_url}
          />
          
          <div className="flex justify-end pt-4 border-t">
            <RequestActions
              request={currentRequest}
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

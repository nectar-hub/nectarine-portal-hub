
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { updateRequestStatusInDB } from "@/utils/request-fetchers";

export function useRequestStatus() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const updateRequestStatus = async (
    requestId: string,
    requestType: 'buy_request' | 'self_purchase',
    newStatus: string
  ) => {
    if (!requestId) return;
    
    setProcessingId(requestId);
    
    try {
      await updateRequestStatusInDB(requestId, requestType, newStatus);
      
      toast({
        title: "Status Updated",
        description: `Request status has been updated to ${newStatus}`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating request status:", error);
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  return {
    processingId,
    updateRequestStatus
  };
}

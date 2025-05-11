
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { updateRequestStatusInDB } from "@/utils/request-fetchers";
import { Request } from "@/types/request";

export function useRequestStatus() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const updateRequestStatus = async (
    requestId: string, 
    requestType: 'buy_request' | 'self_purchase', 
    newStatus: string
  ) => {
    try {
      setProcessingId(requestId);
      
      await updateRequestStatusInDB(requestId, requestType, newStatus);
      
      toast({
        title: "Status Updated",
        description: `Request marked as ${newStatus}`,
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating request status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update the request status",
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

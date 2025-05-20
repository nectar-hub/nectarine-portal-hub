
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { updateRequestStatusInDB } from "@/utils/request-fetchers";

export function useRequestStatus() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const updateStatus = async (
    requestId: string, 
    requestType: 'buy_request' | 'self_purchase', 
    newStatus: string
  ) => {
    setIsUpdating(true);
    setIsError(false);
    
    try {
      await updateRequestStatusInDB(requestId, requestType, newStatus);
      
      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      setIsError(true);
      
      toast({
        title: "Update Failed",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  return { isUpdating, isError, updateStatus };
}

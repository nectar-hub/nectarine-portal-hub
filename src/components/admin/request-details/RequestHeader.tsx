
import { Request } from "@/types/request";
import { format } from "date-fns";
import { RequestTypeIndicator } from "./RequestTypeIndicator";
import { RequestPropertyItem } from "./RequestPropertyItem";
import StatusBadge from "../StatusBadge";

interface RequestHeaderProps {
  request: Request;
}

export const RequestHeader = ({ request }: RequestHeaderProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Request Type</h3>
        <p className="flex items-center">
          <RequestTypeIndicator type={request.request_type} />
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
        <StatusBadge status={request.status} />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">User</h3>
        <p>{request.user_name || 'N/A'}</p>
        <p className="text-sm text-muted-foreground">{request.user_email}</p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Date Submitted</h3>
        <p>{formatDate(request.created_at)}</p>
      </div>
    </div>
  );
};

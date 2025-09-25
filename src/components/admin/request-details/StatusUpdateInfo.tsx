import { Clock, User } from "lucide-react";
import { format } from "date-fns";

interface StatusUpdateInfoProps {
  status: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
}

export const StatusUpdateInfo = ({ status, statusUpdatedAt, statusUpdatedBy }: StatusUpdateInfoProps) => {
  if (!statusUpdatedAt) return null;

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-medium flex items-center mb-2">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        Status History
      </h4>
      <div className="bg-secondary/30 p-3 rounded-md">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">Status:</span>
            <span className="capitalize">{formatStatus(status)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(statusUpdatedAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          {statusUpdatedBy && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Updated by admin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
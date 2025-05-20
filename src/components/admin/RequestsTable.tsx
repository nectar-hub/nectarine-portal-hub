
import { useState } from "react";
import { Request } from "@/types/request";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RequestRow from "./RequestRow";
import RequestDetailsDialog from "./RequestDetailsDialog";

interface RequestsTableProps {
  requests: Request[];
  showType?: boolean;
  processingId: string | null;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
  onDeleteRequest?: (requestId: string, requestType: 'buy_request' | 'self_purchase') => void;
}

const RequestsTable = ({ 
  requests, 
  showType = false, 
  processingId, 
  onUpdateStatus,
  onDeleteRequest
}: RequestsTableProps) => {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  const handleRowClick = (request: Request) => {
    setSelectedRequest(request);
  };
  
  const handleCloseDialog = () => {
    setSelectedRequest(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {showType && <TableHead>Type</TableHead>}
            <TableHead>User</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              showType={showType}
              processingId={processingId}
              onUpdateStatus={onUpdateStatus}
              onViewDetails={handleRowClick}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </TableBody>
      </Table>
      
      <RequestDetailsDialog
        request={selectedRequest}
        processingId={processingId}
        open={!!selectedRequest}
        onOpenChange={(open) => !open && handleCloseDialog()}
        onUpdateStatus={onUpdateStatus}
        onDeleteRequest={onDeleteRequest}
      />
    </>
  );
};

export default RequestsTable;

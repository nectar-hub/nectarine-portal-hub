
import { useState } from "react";
import { Request } from "@/types/request";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Check, X, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

interface RequestsTableProps {
  requests: Request[];
  showType?: boolean;
  processingId: string | null;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
}

const RequestsTable = ({ requests, showType = false, processingId, onUpdateStatus }: RequestsTableProps) => {
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
            <TableRow 
              key={request.id}
              className="cursor-pointer hover:bg-secondary/20"
              onClick={() => handleRowClick(request)}
            >
              {showType && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {request.request_type === 'buy_request' ? (
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Package className="h-4 w-4 text-green-500" />
                    )}
                    <span>
                      {request.request_type === 'buy_request' ? 'Buy Request' : 'Self Purchase'}
                    </span>
                  </div>
                </TableCell>
              )}
              <TableCell>
                <div>
                  <div className="font-medium">{request.user_name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{request.user_email}</div>
                </div>
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                <span title={request.product_name}>
                  {request.product_name}
                </span>
              </TableCell>
              <TableCell>{request.store_name}</TableCell>
              <TableCell>{request.quantity}</TableCell>
              <TableCell>
                {request.price ? `$${request.price.toFixed(2)}` : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={
                  request.status === 'completed' ? 'default' :
                  request.status === 'pending' ? 'outline' :
                  request.status === 'in_transit' ? 'secondary' :
                  request.status === 'processing' ? 'default' :
                  'destructive'
                }>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateStatus(request.id, request.request_type, 'processing')}
                        disabled={processingId === request.id}
                      >
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateStatus(request.id, request.request_type, 'cancelled')}
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
                      onClick={() => onUpdateStatus(request.id, request.request_type, 'in_transit')}
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
                      onClick={() => onUpdateStatus(request.id, request.request_type, 'completed')}
                      disabled={processingId === request.id}
                    >
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(request);
                    }}
                  >
                    <Info className="h-4 w-4 text-blue-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Details for request #{selectedRequest?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Request Type</h3>
                  <p className="flex items-center">
                    {selectedRequest.request_type === 'buy_request' ? (
                      <>
                        <ShoppingCart className="h-4 w-4 text-blue-500 mr-2" />
                        <span>Buy Request</span>
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 text-green-500 mr-2" />
                        <span>Self Purchase</span>
                      </>
                    )}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={
                    selectedRequest.status === 'completed' ? 'default' :
                    selectedRequest.status === 'pending' ? 'outline' :
                    selectedRequest.status === 'in_transit' ? 'secondary' :
                    selectedRequest.status === 'processing' ? 'default' :
                    'destructive'
                  }>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">User</h3>
                  <p>{selectedRequest.user_name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Date Submitted</h3>
                  <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Product Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Product Name</h4>
                    <p>{selectedRequest.product_name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Store</h4>
                    <p>{selectedRequest.store_name || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Quantity</h4>
                    <p>{selectedRequest.quantity}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Price</h4>
                    <p>{selectedRequest.price ? `$${selectedRequest.price.toFixed(2)}` : 'N/A'}</p>
                  </div>
                  
                  {selectedRequest.country && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Country</h4>
                      <p>{selectedRequest.country}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center">
                <h3 className="text-sm font-medium">Actions</h3>
                <div className="space-x-2">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onUpdateStatus(selectedRequest.id, selectedRequest.request_type, 'processing');
                          handleCloseDialog();
                        }}
                        disabled={processingId === selectedRequest.id}
                      >
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onUpdateStatus(selectedRequest.id, selectedRequest.request_type, 'cancelled');
                          handleCloseDialog();
                        }}
                        disabled={processingId === selectedRequest.id}
                      >
                        <X className="h-4 w-4 text-red-500 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === 'processing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onUpdateStatus(selectedRequest.id, selectedRequest.request_type, 'in_transit');
                        handleCloseDialog();
                      }}
                      disabled={processingId === selectedRequest.id}
                    >
                      <Package className="h-4 w-4 text-blue-500 mr-1" />
                      Ship
                    </Button>
                  )}
                  {selectedRequest.status === 'in_transit' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onUpdateStatus(selectedRequest.id, selectedRequest.request_type, 'completed');
                        handleCloseDialog();
                      }}
                      disabled={processingId === selectedRequest.id}
                    >
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestsTable;

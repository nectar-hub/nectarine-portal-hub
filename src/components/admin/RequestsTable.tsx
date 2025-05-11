
import { useState } from "react";
import { Request } from "@/types/request";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Check, X, Info, ExternalLink, Link, Store, Hash, DollarSign, Palette, Ruler, FileText, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Details for request #{selectedRequest?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 mt-4">
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
                <h3 className="text-lg font-medium mb-4">Product Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Package className="h-4 w-4 mr-2 text-gray-500" />
                      Product Name
                    </h4>
                    <p>{selectedRequest.product_name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Store className="h-4 w-4 mr-2 text-gray-500" />
                      Store
                    </h4>
                    <p>{selectedRequest.store_name || 'N/A'}</p>
                  </div>
                  
                  {selectedRequest.product_url && (
                    <div className="space-y-2 col-span-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Link className="h-4 w-4 mr-2 text-gray-500" />
                        Product URL
                      </h4>
                      <p className="break-all">
                        <a 
                          href={selectedRequest.product_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                        >
                          {selectedRequest.product_url}
                          <ExternalLink className="h-4 w-4 ml-1 inline" />
                        </a>
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Hash className="h-4 w-4 mr-2 text-gray-500" />
                      Quantity
                    </h4>
                    <p>{selectedRequest.quantity}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      Price
                    </h4>
                    <p>{selectedRequest.price ? `$${selectedRequest.price.toFixed(2)}` : 'N/A'}</p>
                  </div>
                  
                  {/* Color information */}
                  {selectedRequest.color && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Palette className="h-4 w-4 mr-2 text-gray-500" />
                        Color
                      </h4>
                      <div className="flex items-center gap-2">
                        {selectedRequest.color}
                      </div>
                    </div>
                  )}
                  
                  {/* Size information */}
                  {selectedRequest.size && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Ruler className="h-4 w-4 mr-2 text-gray-500" />
                        Size
                      </h4>
                      <p>{selectedRequest.size}</p>
                    </div>
                  )}
                  
                  {selectedRequest.country && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Country</h4>
                      <p>{selectedRequest.country}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Notes/Instructions */}
              {selectedRequest.notes && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    Notes/Instructions
                  </h4>
                  <div className="bg-secondary/30 p-3 rounded-md whitespace-pre-wrap">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}
              
              {/* Screenshot/Invoice */}
              {selectedRequest.screenshot_url && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium flex items-center mb-2">
                    <Image className="h-4 w-4 mr-2 text-gray-500" />
                    Screenshot/Invoice
                  </h4>
                  <div className="border rounded-md overflow-hidden bg-background">
                    <div className="relative w-full">
                      <AspectRatio ratio={16 / 9} className="bg-muted">
                        <img
                          src={selectedRequest.screenshot_url}
                          alt="Uploaded screenshot or invoice"
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            // If image fails to load, show as a link instead
                            const target = e.target as HTMLImageElement;
                            const container = target.parentNode?.parentNode as HTMLDivElement;
                            if (container) {
                              const link = document.createElement('a');
                              link.href = selectedRequest.screenshot_url || '';
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              link.className = 'text-blue-500 hover:underline flex items-center justify-center h-full';
                              link.innerHTML = `
                                <span class="flex items-center">
                                  View File
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </span>
                              `;
                              container.innerHTML = '';
                              container.appendChild(link);
                            }
                          }}
                        />
                      </AspectRatio>
                    </div>
                    <div className="p-2 text-center">
                      <a 
                        href={selectedRequest.screenshot_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm flex items-center justify-center"
                      >
                        Open in new tab
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
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

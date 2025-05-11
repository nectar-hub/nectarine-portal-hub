
import { Request } from "@/types/request";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import StatusBadge from "./StatusBadge";
import RequestActions from "./RequestActions";
import {
  ShoppingCart,
  Package,
  Check,
  X,
  Link,
  ExternalLink,
  Store,
  Hash,
  DollarSign,
  Palette,
  Ruler,
  FileText,
  Image,
  Calendar,
  Truck,
  List
} from "lucide-react";
import { format } from "date-fns";

interface RequestDetailsDialogProps {
  request: Request | null;
  processingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (requestId: string, requestType: 'buy_request' | 'self_purchase', newStatus: string) => void;
}

const RequestDetailsDialog = ({
  request,
  processingId,
  open,
  onOpenChange,
  onUpdateStatus
}: RequestDetailsDialogProps) => {
  if (!request) return null;
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  const hasMultipleItems = request.items && request.items.length > 0;

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Request Type</h3>
              <p className="flex items-center">
                {request.request_type === 'buy_request' ? (
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
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">
              {hasMultipleItems ? 'Items' : 'Product Information'}
            </h3>
            
            {hasMultipleItems ? (
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {request.items?.map((item, index) => (
                    <AccordionItem key={item.id || index} value={`item-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full text-left">
                          <span className="font-medium">
                            {item.product_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.price ? `$${Number(item.price).toFixed(2)}` : 'N/A'} × {item.quantity}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center">
                              <Store className="h-4 w-4 mr-2 text-gray-500" />
                              Store
                            </h4>
                            <p>{item.store_name || request.store_name || 'N/A'}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center">
                              <Hash className="h-4 w-4 mr-2 text-gray-500" />
                              Quantity
                            </h4>
                            <p>{item.quantity}</p>
                          </div>
                          
                          {item.price && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                                Price
                              </h4>
                              <p>{`$${Number(item.price).toFixed(2)}`}</p>
                            </div>
                          )}
                          
                          {item.product_url && (
                            <div className="space-y-2 col-span-2">
                              <h4 className="text-sm font-medium flex items-center">
                                <Link className="h-4 w-4 mr-2 text-gray-500" />
                                Product URL
                              </h4>
                              <p className="break-all">
                                <a 
                                  href={item.product_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline flex items-center"
                                >
                                  {item.product_url}
                                  <ExternalLink className="h-4 w-4 ml-1 inline" />
                                </a>
                              </p>
                            </div>
                          )}
                          
                          {item.color && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center">
                                <Palette className="h-4 w-4 mr-2 text-gray-500" />
                                Color
                              </h4>
                              <div className="flex items-center gap-2">
                                {item.color}
                              </div>
                            </div>
                          )}
                          
                          {item.size && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center">
                                <Ruler className="h-4 w-4 mr-2 text-gray-500" />
                                Size
                              </h4>
                              <p>{item.size}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                {request.country && (
                  <div className="space-y-2 border-t pt-3">
                    <h4 className="text-sm font-medium">Country of Purchase</h4>
                    <p>{request.country}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    Product Name
                  </h4>
                  <p>{request.product_name}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <Store className="h-4 w-4 mr-2 text-gray-500" />
                    Store
                  </h4>
                  <p>{request.store_name || 'N/A'}</p>
                </div>
                
                {request.product_url && (
                  <div className="space-y-2 col-span-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Link className="h-4 w-4 mr-2 text-gray-500" />
                      Product URL
                    </h4>
                    <p className="break-all">
                      <a 
                        href={request.product_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center"
                      >
                        {request.product_url}
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
                  <p>{request.quantity}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                    Price
                  </h4>
                  <p>{request.price ? `$${Number(request.price).toFixed(2)}` : 'N/A'}</p>
                </div>
                
                {/* Color information - only show if available */}
                {request.color && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Palette className="h-4 w-4 mr-2 text-gray-500" />
                      Color
                    </h4>
                    <div className="flex items-center gap-2">
                      {request.color}
                    </div>
                  </div>
                )}
                
                {/* Size information - only show if available */}
                {request.size && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Ruler className="h-4 w-4 mr-2 text-gray-500" />
                      Size
                    </h4>
                    <p>{request.size}</p>
                  </div>
                )}
                
                {request.country && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Country</h4>
                    <p>{request.country}</p>
                  </div>
                )}

                {/* Delivery Deadline - show for buy requests if available */}
                {request.request_type === 'buy_request' && request.delivery_deadline && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      Delivery Deadline
                    </h4>
                    <p>{formatDate(request.delivery_deadline)}</p>
                  </div>
                )}

                {/* Self-purchase specific fields */}
                {request.request_type === 'self_purchase' && (
                  <>
                    {request.tracking_number && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center">
                          <Hash className="h-4 w-4 mr-2 text-gray-500" />
                          Tracking Number
                        </h4>
                        <p>{request.tracking_number}</p>
                      </div>
                    )}
                    
                    {request.courier && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-gray-500" />
                          Courier
                        </h4>
                        <p>{request.courier}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Notes/Instructions - conditionally show if available */}
          {request.notes && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium flex items-center mb-2">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Notes/Instructions
              </h4>
              <div className="bg-secondary/30 p-3 rounded-md whitespace-pre-wrap">
                {request.notes}
              </div>
            </div>
          )}
          
          {/* Screenshot/Invoice - conditionally show based on request type */}
          {(request.screenshot_url || request.invoice_url) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium flex items-center mb-2">
                <Image className="h-4 w-4 mr-2 text-gray-500" />
                {request.request_type === 'buy_request' ? 'Screenshot' : 'Invoice'}
              </h4>
              <div className="border rounded-md overflow-hidden bg-background">
                <div className="relative w-full">
                  <AspectRatio ratio={16 / 9} className="bg-muted">
                    <img
                      src={request.screenshot_url || request.invoice_url}
                      alt={request.request_type === 'buy_request' ? 'Uploaded screenshot' : 'Uploaded invoice'}
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        // If image fails to load, show as a link instead
                        const target = e.target as HTMLImageElement;
                        const container = target.parentNode?.parentNode as HTMLDivElement;
                        if (container) {
                          const link = document.createElement('a');
                          link.href = request.screenshot_url || request.invoice_url || '';
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
                    href={request.screenshot_url || request.invoice_url} 
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
            <RequestActions 
              request={request}
              processingId={processingId}
              onUpdate={onUpdateStatus}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsDialog;

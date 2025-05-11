
import { Request } from "@/types/request";
import { format } from "date-fns";
import { 
  Package, Store, Hash, DollarSign, 
  Link, Palette, Ruler, Calendar, Truck
} from "lucide-react";
import { RequestPropertyItem } from "./RequestPropertyItem";
import { ProductLink } from "./ProductLink";

interface SingleItemDetailsProps {
  request: Request;
}

export const SingleItemDetails = ({ request }: SingleItemDetailsProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RequestPropertyItem 
        icon={Package} 
        label="Product Name" 
        value={request.product_name} 
      />
      
      <RequestPropertyItem 
        icon={Store} 
        label="Store" 
        value={request.store_name || 'N/A'} 
      />
      
      {request.product_url && (
        <RequestPropertyItem 
          icon={Link} 
          label="Product URL" 
          value={<ProductLink url={request.product_url} />}
          colSpan
        />
      )}
      
      <RequestPropertyItem 
        icon={Hash} 
        label="Quantity" 
        value={request.quantity.toString()} 
      />
      
      <RequestPropertyItem 
        icon={DollarSign} 
        label="Price" 
        value={request.price ? `$${Number(request.price).toFixed(2)}` : 'N/A'} 
      />
      
      {request.color && (
        <RequestPropertyItem 
          icon={Palette} 
          label="Color" 
          value={request.color} 
        />
      )}
      
      {request.size && (
        <RequestPropertyItem 
          icon={Ruler} 
          label="Size" 
          value={request.size} 
        />
      )}
      
      {request.country && (
        <RequestPropertyItem 
          label="Country" 
          value={request.country} 
        />
      )}

      {request.request_type === 'buy_request' && request.delivery_deadline && (
        <RequestPropertyItem 
          icon={Calendar} 
          label="Delivery Deadline" 
          value={formatDate(request.delivery_deadline)} 
        />
      )}

      {request.request_type === 'self_purchase' && (
        <>
          {request.tracking_number && (
            <RequestPropertyItem 
              icon={Hash} 
              label="Tracking Number" 
              value={request.tracking_number} 
            />
          )}
          
          {request.courier && (
            <RequestPropertyItem 
              icon={Truck} 
              label="Courier" 
              value={request.courier} 
            />
          )}
        </>
      )}
    </div>
  );
};

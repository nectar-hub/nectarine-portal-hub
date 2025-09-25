
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'outline', label: 'Pending' };
      case 'received':
        return { variant: 'secondary', label: 'Received' };
      case 'in_transit':
        return { variant: 'default', label: 'In Transit' };
      case 'arrived':
        return { variant: 'secondary', label: 'Arrived' };
      case 'collected':
        return { variant: 'default', label: 'Collected' };
      // Buy Request statuses
      case 'order_received':
        return { variant: 'secondary', label: 'Order Received' };
      case 'order_placed':
        return { variant: 'default', label: 'Order Placed' };
      case 'order_delivered':
        return { variant: 'secondary', label: 'Order Delivered' };
      case 'order_in_transit':
        return { variant: 'default', label: 'Order in Transit' };
      case 'order_arrived':
        return { variant: 'secondary', label: 'Order Arrived' };
      case 'order_collected':
        return { variant: 'default', label: 'Order Collected' };
      // Legacy statuses
      case 'processing':
        return { variant: 'default', label: 'Processing' };
      case 'completed':
        return { variant: 'default', label: 'Completed' };
      case 'cancelled':
        return { variant: 'destructive', label: 'Cancelled' };
      default:
        return { variant: 'outline', label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') };
    }
  };

  const { variant, label } = getStatusConfig(status);
    
  return (
    <Badge variant={variant as any}>
      {label}
    </Badge>
  );
};

export default StatusBadge;

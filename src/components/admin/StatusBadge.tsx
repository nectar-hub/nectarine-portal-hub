
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variant = 
    status === 'completed' ? 'default' :
    status === 'pending' ? 'outline' :
    status === 'in_transit' ? 'secondary' :
    status === 'processing' ? 'default' :
    'destructive';
    
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  
  return (
    <Badge variant={variant as any}>
      {displayStatus}
    </Badge>
  );
};

export default StatusBadge;

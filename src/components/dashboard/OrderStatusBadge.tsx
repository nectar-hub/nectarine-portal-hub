
interface OrderStatusBadgeProps {
  status: string;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  let colorClass;
  
  switch (status) {
    case 'completed':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'in_transit':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'processing':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'cancelled':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'pending':
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

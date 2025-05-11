
import { ShoppingCart, Package } from "lucide-react";

interface RequestTypeIndicatorProps {
  type: 'buy_request' | 'self_purchase';
}

export const RequestTypeIndicator = ({ type }: RequestTypeIndicatorProps) => {
  return type === 'buy_request' ? (
    <>
      <ShoppingCart className="h-4 w-4 text-blue-500 mr-2" />
      <span>Buy Request</span>
    </>
  ) : (
    <>
      <Package className="h-4 w-4 text-green-500 mr-2" />
      <span>Self Purchase</span>
    </>
  );
};

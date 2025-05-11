
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OrderFiltersProps {
  orderType: string;
  status: string;
  onOrderTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const OrderFilters = ({ 
  orderType, 
  status, 
  onOrderTypeChange, 
  onStatusChange 
}: OrderFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Order Type:</span>
          <Select value={orderType} onValueChange={onOrderTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="buy_request">Buy For Me</SelectItem>
              <SelectItem value="self_purchase">Self Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button 
          className="nectarine-gradient hover:opacity-90 transition-opacity"
          size="sm"
          asChild
        >
          <a href="/dashboard/buy-for-me">New Buy Request</a>
        </Button>
      </div>
    </div>
  );
};

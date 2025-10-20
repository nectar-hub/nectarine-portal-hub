import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type Client = {
  id: string;
  client_name: string;
};

type Filters = {
  dateFrom: string;
  dateTo: string;
  clientId: string;
  destination: string;
  status: string;
};

type ShipmentFiltersProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  clients: Client[];
};

const ShipmentFilters = ({ filters, setFilters, clients }: ShipmentFiltersProps) => {
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      clientId: '',
      destination: '',
      status: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-sm">Filters</h4>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="text-xs font-medium mb-1 block">Date From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Date To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Client</label>
          <Select
            value={filters.clientId}
            onValueChange={(value) => setFilters({ ...filters, clientId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Destination</label>
          <Input
            placeholder="e.g., USA"
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="RECEIVED">RECEIVED</SelectItem>
              <SelectItem value="PROCESSING">PROCESSING</SelectItem>
              <SelectItem value="READY">READY</SelectItem>
              <SelectItem value="SENT">SENT</SelectItem>
              <SelectItem value="DELIVERED">DELIVERED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ShipmentFilters;

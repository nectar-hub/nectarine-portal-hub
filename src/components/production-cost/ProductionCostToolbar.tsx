import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Plus, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProductionCostWithConsignment, formatCurrency, calculateTotalCost } from '@/types/production-cost';
import * as XLSX from 'xlsx';

interface ProductionCostToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateFilter: Date | undefined;
  onDateFilterChange: (date: Date | undefined) => void;
  onAddClick: () => void;
  data: ProductionCostWithConsignment[];
}

export const ProductionCostToolbar = ({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  onAddClick,
  data,
}: ProductionCostToolbarProps) => {
  const [dateOpen, setDateOpen] = useState(false);

  const exportToCSV = () => {
    const headers = [
      'Consignment Name',
      'Dead Weight (kg)',
      'Chargeable Weight (kg)',
      'Airline Freight',
      'Office Handling',
      'Arrival Clearance',
      'ZNZ Airport→Ferry',
      'ZNZ→Dar Shipping',
      'Dar Clearance',
      'Dar Ferry→Office',
      'Labour Cost',
      'Total Cost',
      'Cost/Dead Kg',
      'Cost/Chargeable Kg',
      'Currency',
      'Cost Date',
      'Notes',
    ];

    const rows = data.map((row) => {
      const total = calculateTotalCost(row);
      const costPerDead = row.total_dead_weight ? (total / row.total_dead_weight).toFixed(2) : 'N/A';
      const costPerChargeable = row.total_chargeable_weight ? (total / row.total_chargeable_weight).toFixed(2) : 'N/A';

      return [
        row.consignment?.consignment_name || '',
        row.total_dead_weight.toFixed(2),
        row.total_chargeable_weight.toFixed(2),
        row.airline_freight_cost,
        row.office_handling_cost,
        row.arrival_clearance_cost,
        row.znz_airport_to_ferry_transport_cost,
        row.znz_to_dar_shipping_cost,
        row.dar_clearance_cost,
        row.dar_ferry_to_office_transport_cost,
        row.labour_helpers_cost,
        total.toFixed(2),
        costPerDead,
        costPerChargeable,
        row.currency,
        row.cost_date,
        row.notes || '',
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `production_costs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToXLSX = () => {
    const wsData = data.map((row) => {
      const total = calculateTotalCost(row);
      return {
        'Consignment Name': row.consignment?.consignment_name || '',
        'Dead Weight (kg)': row.total_dead_weight,
        'Chargeable Weight (kg)': row.total_chargeable_weight,
        'Airline Freight': row.airline_freight_cost,
        'Office Handling': row.office_handling_cost,
        'Arrival Clearance': row.arrival_clearance_cost,
        'ZNZ Airport→Ferry': row.znz_airport_to_ferry_transport_cost,
        'ZNZ→Dar Shipping': row.znz_to_dar_shipping_cost,
        'Dar Clearance': row.dar_clearance_cost,
        'Dar Ferry→Office': row.dar_ferry_to_office_transport_cost,
        'Labour Cost': row.labour_helpers_cost,
        'Total Cost': total,
        'Cost/Dead Kg': row.total_dead_weight ? total / row.total_dead_weight : 0,
        'Cost/Chargeable Kg': row.total_chargeable_weight ? total / row.total_chargeable_weight : 0,
        Currency: row.currency,
        'Cost Date': row.cost_date,
        Notes: row.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Production Costs');
    XLSX.writeFile(wb, `production_costs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by consignment name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-[180px] justify-start text-left font-normal', !dateFilter && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, 'PPP') : 'Filter by date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={(date) => {
                onDateFilterChange(date);
                setDateOpen(false);
              }}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {dateFilter && (
          <Button variant="ghost" size="icon" onClick={() => onDateFilterChange(undefined)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportToXLSX}>
          <Download className="mr-2 h-4 w-4" />
          XLSX
        </Button>
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Production Cost
        </Button>
      </div>
    </div>
  );
};

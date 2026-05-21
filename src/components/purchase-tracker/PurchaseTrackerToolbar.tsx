import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PurchaseTracker, PurchaseStatus, PurchaseRegion } from '@/types/purchase-tracker';
import { Search, Download, Upload, Plus, RefreshCw, CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PurchaseRowEditor } from './PurchaseRowEditor';
import { MonthPeriodSelector } from './MonthPeriodSelector';
import { toast } from 'sonner';

interface PurchaseTrackerToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  regionFilter: string;
  onRegionFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  selectedPeriodId: string | null;
  onPeriodChange: (periodId: string | null) => void;
  clients: Array<{ id: string; client_name: string }>;
  purchases: PurchaseTracker[];
  totals: { totalQty: number; totalAmount: number };
  onRefresh: () => void;
}

export function PurchaseTrackerToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  regionFilter,
  onRegionFilterChange,
  clientFilter,
  onClientFilterChange,
  dateRange,
  onDateRangeChange,
  selectedPeriodId,
  onPeriodChange,
  clients,
  purchases,
  totals,
  onRefresh,
}: PurchaseTrackerToolbarProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleExport = async () => {
    const exportData = purchases.map((p) => ({
      'Invoice Date': p.invoice_date,
      'Client Name': p.client_name,
      'Invoice No': p.invoice_no || '',
      'Item': p.item_description,
      'Qty': p.qty,
      'From': p.from_region,
      'Store': p.store_name || '',
      'Amount': p.amount || '',
      'DOP': p.dop || '',
      'Store Order No': p.store_order_no || '',
      'Purchased By': p.purchased_by || '',
      'DOD': p.dod || '',
      'Status': p.status,
      'Remarks': p.remarks || '',
      'Link': p.source_link || '',
    }));

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Tracker');
    XLSX.writeFile(wb, `purchase-tracker-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Export completed');
  };

  const handleClearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onRegionFilterChange('all');
    onClientFilterChange('all');
    onDateRangeChange({ from: undefined, to: undefined });
  };

  return (
    <div className="p-4 border-b space-y-3">
      {/* Top Row - Month Selector and Actions */}
      <div className="flex gap-2 items-center justify-between">
        <MonthPeriodSelector 
          selectedPeriodId={selectedPeriodId}
          onPeriodChange={onPeriodChange}
        />

        <div className="flex gap-2">
          <Button onClick={() => setIsAddingNew(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Purchase
          </Button>

          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Row */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, invoices, stores, remarks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 items-center flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[200px] justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM dd, yyyy')
                )
              ) : (
                'Date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {clientFilter === 'all' 
                ? 'All Clients' 
                : clients.find(c => c.id === clientFilter)?.client_name || 'All Clients'}
              <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search clients..." />
              <CommandList>
                <CommandEmpty>No client found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="all" onSelect={() => onClientFilterChange('all')}>
                    All Clients
                  </CommandItem>
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={client.client_name}
                      onSelect={() => onClientFilterChange(client.id)}
                    >
                      {client.client_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={regionFilter} onValueChange={onRegionFilterChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="UK">UK</SelectItem>
            <SelectItem value="US">US</SelectItem>
            <SelectItem value="UAE">UAE</SelectItem>
            <SelectItem value="CN">CN</SelectItem>
            <SelectItem value="EU">EU</SelectItem>
            <SelectItem value="AU">AU</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ORDERED">Ordered</SelectItem>
            <SelectItem value="PARTIAL_ORDERED">Partial Ordered</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleClearFilters} variant="ghost" size="sm">
          Clear Filters
        </Button>

        {/* Summary Stats */}
        <div className="ml-auto flex gap-4 text-sm">
          <div className="px-3 py-1 bg-muted rounded-md">
            <span className="font-medium">Records:</span>{' '}
            <span className="font-bold text-primary">{purchases.length}</span>
          </div>
          <div className="px-3 py-1 bg-muted rounded-md">
            <span className="font-medium">Qty:</span>{' '}
            <span className="font-bold text-primary">{totals.totalQty}</span>
          </div>
          <div className="px-3 py-1 bg-muted rounded-md">
            <span className="font-medium">Amount:</span>{' '}
            <span className="font-bold text-primary">{totals.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {isAddingNew && (
        <PurchaseRowEditor
          purchase={null}
          clients={clients}
          open={isAddingNew}
          onOpenChange={setIsAddingNew}
          defaultMonthPeriodId={selectedPeriodId}
          onSave={() => {
            setIsAddingNew(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

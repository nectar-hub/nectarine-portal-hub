import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { PurchaseFilters, PurchaseTracker } from '@/types/purchase-tracker';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface PurchaseTrackerToolbarProps {
  filters: PurchaseFilters;
  onFiltersChange: (filters: PurchaseFilters) => void;
  purchases: PurchaseTracker[];
  totals: { totalQty: number; totalAmount: number };
}

const PurchaseTrackerToolbar = ({
  filters,
  onFiltersChange,
  purchases,
  totals,
}: PurchaseTrackerToolbarProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, search: value });
  };

  const handleExportCSV = () => {
    if (purchases.length === 0) {
      toast({
        title: 'No data',
        description: 'There is no data to export',
        variant: 'destructive',
      });
      return;
    }

    const exportData = purchases.map((p) => ({
      'Invoice Date': p.invoice_date,
      'Client Name': p.client_name,
      'Invoice No': p.invoice_no || '',
      Item: p.item_description,
      Qty: p.qty,
      From: p.from_region,
      Store: p.store_name || '',
      Amount: p.amount || '',
      DOP: p.dop || '',
      'Store Order No': p.store_order_no || '',
      'Purchased By': p.purchased_by || '',
      DOD: p.dod || '',
      Status: p.status,
      Remarks: p.remarks || '',
      Link: p.source_link || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Tracker');
    XLSX.writeFile(wb, `purchase_tracker_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Export successful',
      description: `Exported ${purchases.length} records`,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search items, invoices, stores, remarks..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" disabled>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={filters.region || ''}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                region: value as any,
              })
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Regions</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="UAE">UAE</SelectItem>
              <SelectItem value="CN">CN</SelectItem>
              <SelectItem value="EU">EU</SelectItem>
              <SelectItem value="AU">AU</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || ''}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as any,
              })
            }
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="ORDERED">ORDERED</SelectItem>
              <SelectItem value="RECEIVED">RECEIVED</SelectItem>
              <SelectItem value="IN TRANSIT">IN TRANSIT</SelectItem>
              <SelectItem value="READY">READY</SelectItem>
              <SelectItem value="DELIVERED">DELIVERED</SelectItem>
              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
          </Select>

          {(filters.region || filters.status || filters.search) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Totals Summary */}
        <div className="flex gap-8 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total QTY</p>
            <p className="text-2xl font-bold">{totals.totalQty}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">
              {totals.totalAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Records</p>
            <p className="text-2xl font-bold">{purchases.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseTrackerToolbar;

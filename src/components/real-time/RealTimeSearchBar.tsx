import { useState } from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { PaymentAccount } from '@/types/real-time';
import { PAYMENT_ACCOUNT_LABELS, PAYMENT_ACCOUNTS } from '@/types/real-time';

export type AmountFilter = 'all' | 'inflows' | 'outflows';
export type SortField = 'default' | 'amount_asc' | 'amount_desc' | 'item_asc' | 'item_desc';

export interface TransactionFilters {
  searchQuery: string;
  paymentAccount: PaymentAccount | 'all';
  amountFilter: AmountFilter;
  sortField: SortField;
}

interface RealTimeSearchBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  resultCount: number;
  totalCount: number;
}

export const RealTimeSearchBar = ({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
}: RealTimeSearchBarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [
    filters.paymentAccount !== 'all',
    filters.amountFilter !== 'all',
    filters.sortField !== 'default',
  ].filter(Boolean).length;

  const hasActiveFilters = filters.searchQuery || activeFilterCount > 0;

  const clearAll = () => {
    onFiltersChange({
      searchQuery: '',
      paymentAccount: 'all',
      amountFilter: 'all',
      sortField: 'default',
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by item, description, or reference..."
          value={filters.searchQuery}
          onChange={(e) =>
            onFiltersChange({ ...filters, searchQuery: e.target.value })
          }
          className="pl-9 pr-9"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Popover */}
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Payment Account</label>
            <Select
              value={filters.paymentAccount}
              onValueChange={(val) =>
                onFiltersChange({
                  ...filters,
                  paymentAccount: val as PaymentAccount | 'all',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {PAYMENT_ACCOUNTS.map((acc) => (
                  <SelectItem key={acc} value={acc}>
                    {PAYMENT_ACCOUNT_LABELS[acc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Transaction Type</label>
            <Select
              value={filters.amountFilter}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, amountFilter: val as AmountFilter })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="inflows">Inflows Only (+)</SelectItem>
                <SelectItem value="outflows">Outflows Only (−)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sort By</label>
            <Select
              value={filters.sortField}
              onValueChange={(val) =>
                onFiltersChange({ ...filters, sortField: val as SortField })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Entry Order</SelectItem>
                <SelectItem value="amount_desc">Amount (High → Low)</SelectItem>
                <SelectItem value="amount_asc">Amount (Low → High)</SelectItem>
                <SelectItem value="item_asc">Item (A → Z)</SelectItem>
                <SelectItem value="item_desc">Item (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear All */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 shrink-0 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      {/* Result Count */}
      {hasActiveFilters && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
};

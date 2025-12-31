import { Currency } from '@/types/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExchangeRate } from '@/types/currency';
import { format } from 'date-fns';

interface ExchangeRatesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  currencyFilter: string;
  onCurrencyFilterChange: (value: string) => void;
  currencies: Currency[];
  onAddClick: () => void;
  rates: ExchangeRate[];
}

export function ExchangeRatesToolbar({
  searchQuery,
  onSearchChange,
  currencyFilter,
  onCurrencyFilterChange,
  currencies,
  onAddClick,
  rates,
}: ExchangeRatesToolbarProps) {
  const handleExport = (type: 'csv' | 'xlsx') => {
    const data = rates.map((rate) => ({
      'Base Currency': rate.base_currency,
      'Quote Currency': rate.quote_currency,
      'Rate': rate.rate,
      'Effective From': format(new Date(rate.effective_from), 'yyyy-MM-dd'),
      'Effective To': rate.effective_to ? format(new Date(rate.effective_to), 'yyyy-MM-dd') : '',
      'Source': rate.source || 'manual',
      'Active': rate.is_active ? 'Yes' : 'No',
      'Notes': rate.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exchange Rates');

    const fileName = `exchange-rates-${format(new Date(), 'yyyy-MM-dd')}.${type}`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={currencyFilter} onValueChange={onCurrencyFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Currencies</SelectItem>
            {currencies
              .filter((c) => c.is_active)
              .map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
          <Download className="mr-2 h-4 w-4" />
          Excel
        </Button>
        <Button onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rate
        </Button>
      </div>
    </div>
  );
}

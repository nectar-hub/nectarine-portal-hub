import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { cn } from '@/lib/utils';

interface ProductionCostReportsFiltersProps {
  onFilterChange: (startDate: Date, endDate: Date) => void;
}

export function ProductionCostReportsFilters({ onFilterChange }: ProductionCostReportsFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-month');
  const [customStartDate, setCustomStartDate] = useState<Date>(startOfMonth(new Date()));
  const [customEndDate, setCustomEndDate] = useState<Date>(endOfMonth(new Date()));

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    const now = new Date();

    switch (value) {
      case 'this-month':
        onFilterChange(startOfMonth(now), endOfMonth(now));
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        onFilterChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
        break;
      case 'this-year':
        onFilterChange(startOfYear(now), endOfYear(now));
        break;
      case 'custom':
        // Don't trigger filter change yet, wait for user to select dates
        break;
    }
  };

  const handleCustomDateApply = () => {
    onFilterChange(customStartDate, customEndDate);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="this-year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === 'custom' && (
        <>
          <DatePicker
            value={customStartDate}
            onChange={(date) => date && setCustomStartDate(date)}
            placeholder="Start date"
            className="w-[180px]"
          />

          <DatePicker
            value={customEndDate}
            onChange={(date) => date && setCustomEndDate(date)}
            placeholder="End date"
            className="w-[180px]"
          />

          <Button onClick={handleCustomDateApply}>Apply</Button>
        </>
      )}
    </div>
  );
}

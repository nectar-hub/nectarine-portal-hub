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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !customStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, 'PPP') : 'Start date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => date && setCustomStartDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !customEndDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, 'PPP') : 'End date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => date && setCustomEndDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleCustomDateApply}>Apply</Button>
        </>
      )}
    </div>
  );
}

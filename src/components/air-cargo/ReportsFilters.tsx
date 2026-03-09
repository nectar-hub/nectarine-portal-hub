import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

interface ReportsFiltersProps {
  onFilterChange: (startDate: Date, endDate: Date) => void;
}

const ReportsFilters = ({ onFilterChange }: ReportsFiltersProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    const today = new Date();
    
    switch (value) {
      case 'this-month':
        onFilterChange(startOfMonth(today), endOfMonth(today));
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        onFilterChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
        break;
      case 'this-year':
        onFilterChange(startOfYear(today), endOfYear(today));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          onFilterChange(customStartDate, customEndDate);
        }
        break;
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onFilterChange(customStartDate, customEndDate);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium">Period</label>
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
      </div>

      {selectedPeriod === 'custom' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <DatePicker
              value={customStartDate}
              onChange={setCustomStartDate}
              placeholder="Pick a date"
              className="w-[180px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <DatePicker
              value={customEndDate}
              onChange={setCustomEndDate}
              placeholder="Pick a date"
              className="w-[180px]"
            />
          </div>

          <Button onClick={handleCustomDateApply}>Apply</Button>
        </>
      )}
    </div>
  );
};

export default ReportsFilters;

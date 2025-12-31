import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Copy, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RealTimeDaySelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  hasDay: boolean;
  onCreateDay: () => void;
  onCopyPreviousDay: () => void;
  onExportDay: () => void;
  onExportMonth: () => void;
  isCreatingDay?: boolean;
  isCopyingDay?: boolean;
}

export const RealTimeDaySelector = ({
  selectedDate,
  onDateChange,
  hasDay,
  onCreateDay,
  onCopyPreviousDay,
  onExportDay,
  onExportMonth,
  isCreatingDay,
  isCopyingDay,
}: RealTimeDaySelectorProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!hasDay && (
          <Button onClick={onCreateDay} disabled={isCreatingDay} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Day
          </Button>
        )}

        <Button
          onClick={onCopyPreviousDay}
          disabled={isCopyingDay}
          variant="outline"
          size="sm"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Previous Day
        </Button>

        {hasDay && (
          <>
            <Button onClick={onExportDay} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Day
            </Button>

            <Button onClick={onExportMonth} variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Month
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

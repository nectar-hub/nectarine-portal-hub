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
    <div className="p-4 bg-card rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasDay ? 'Viewing daily entries' : 'No record for this date'}
            </p>
          </div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Change Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
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

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
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

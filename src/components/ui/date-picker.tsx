import * as React from "react";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Format string for date-fns */
  dateFormat?: string;
  /** Show Today / Clear quick actions inside the popover */
  showQuickActions?: boolean;
  /** Allow clearing via an X button on the trigger */
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  dateFormat = "PPP",
  showQuickActions = true,
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "group relative h-10 justify-start gap-2 pl-3 pr-3 text-left font-normal transition-colors",
            "hover:border-primary/50 hover:bg-accent/40",
            "data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="flex-1 truncate">
            {value ? format(value, dateFormat) : placeholder}
          </span>
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="ml-1 rounded-sm p-0.5 opacity-60 hover:bg-muted hover:opacity-100 transition-opacity"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-xl border p-0 shadow-lg animate-in fade-in-0 zoom-in-95"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={handleSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
        {showQuickActions && (
          <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleSelect(new Date())}
            >
              Today
            </Button>
            <div className="flex items-center gap-1">
              {value && (
                <span className="text-xs text-muted-foreground">
                  {isSameDay(value, new Date())
                    ? "Today"
                    : format(value, "EEE, MMM d")}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleSelect(undefined)}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

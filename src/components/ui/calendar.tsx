import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const initialMonth =
    props.month ||
    props.defaultMonth ||
    (props as any).selected ||
    new Date();
  const [displayMonth, setDisplayMonth] = React.useState<Date>(initialMonth);

  // Keep in sync when parent-controlled `month` changes
  React.useEffect(() => {
    if (props.month) setDisplayMonth(props.month);
  }, [props.month]);

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(
    () => Array.from({ length: 21 }, (_, i) => currentYear - 15 + i),
    [currentYear]
  );


  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      month={displayMonth}
      onMonthChange={setDisplayMonth}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "hidden",
        caption_dropdowns: "flex items-center gap-1",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-medium text-[0.72rem] uppercase tracking-wide",
        row: "flex w-full mt-1.5",
        cell: cn(
          "relative h-9 w-9 p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected])]:rounded-md",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected].day-outside)]:bg-accent/40"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground shadow-sm",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground"
        ),
        day_today:
          "border border-primary/60 text-foreground font-semibold",
        day_outside:
          "day-outside text-muted-foreground/60 aria-selected:bg-accent/40 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/40 line-through",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        CaptionLabel: () => null,
        Caption: ({ displayMonth: dm }) => (
          <div className="flex items-center justify-center gap-1 px-1 pt-1 pb-2">
            <div className="flex items-center gap-1">
              <Select
                value={dm.getMonth().toString()}
                onValueChange={(val) => {
                  const newDate = new Date(dm);
                  newDate.setMonth(parseInt(val));
                  setDisplayMonth(newDate);
                }}
              >
                <SelectTrigger className="h-8 w-[112px] text-xs font-semibold border-none shadow-none bg-transparent hover:bg-accent focus:ring-0 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto max-h-64">
                  {MONTHS.map((month, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-xs">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={dm.getFullYear().toString()}
                onValueChange={(val) => {
                  const newDate = new Date(dm);
                  newDate.setFullYear(parseInt(val));
                  setDisplayMonth(newDate);
                }}
              >
                <SelectTrigger className="h-8 w-[80px] text-xs font-semibold border-none shadow-none bg-transparent hover:bg-accent focus:ring-0 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto max-h-64">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-xs">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

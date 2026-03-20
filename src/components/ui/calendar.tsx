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

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [displayMonth, setDisplayMonth] = React.useState(
    props.defaultMonth || (props as any).selected || new Date()
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      month={displayMonth}
      onMonthChange={setDisplayMonth}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "hidden",
        caption_dropdowns: "flex items-center gap-1",
        nav: "hidden",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        CaptionLabel: () => null,
        Caption: ({ displayMonth: dm }) => {
          return (
            <div className="flex items-center justify-center gap-1 pt-1">
              <Select
                value={dm.getMonth().toString()}
                onValueChange={(val) => {
                  const newDate = new Date(dm);
                  newDate.setMonth(parseInt(val));
                  setDisplayMonth(newDate);
                }}
              >
                <SelectTrigger className="h-7 w-[110px] text-xs font-medium border-none shadow-none focus:ring-0 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
                  {months.map((month, i) => (
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
                <SelectTrigger className="h-7 w-[72px] text-xs font-medium border-none shadow-none focus:ring-0 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-xs">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

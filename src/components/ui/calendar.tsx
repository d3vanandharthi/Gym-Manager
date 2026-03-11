import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/src/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 rdp-themed", className)}
      classNames={{
        // Only override visual / color classes — leave all layout classes to react-day-picker CSS
        nav_button: cn(
          "rdp-nav_button",
          "hover:opacity-100 transition-opacity"
        ),
        day_selected: "rdp-day_selected !bg-[var(--accent)] !text-white hover:!bg-[var(--accent)] focus:!bg-[var(--accent)]",
        day_today: "rdp-day_today !bg-transparent !font-bold !underline decoration-[var(--accent)] decoration-2",
        day_outside: "rdp-day_outside !opacity-30",
        day_disabled: "rdp-day_disabled !opacity-30 !cursor-not-allowed",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...p }) => <ChevronLeft className="h-4 w-4" {...p} />,
        IconRight: ({ ...p }) => <ChevronRight className="h-4 w-4" {...p} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

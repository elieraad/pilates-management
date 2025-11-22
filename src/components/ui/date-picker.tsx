"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "./button";

type DatePickerMode = "day" | "week";

interface DatePickerProps {
  date: string;
  setSelectedDate: (newDate: Date | ((prev: Date) => Date)) => void;

  mode?: DatePickerMode;

  // Configurability
  showDatePicker?: boolean;
  customPicker?: React.ReactNode;

  showPrevNextButtons?: boolean;
  showTodayButton?: boolean;

  prevLabel?: string;
  nextLabel?: string;
  todayLabel?: string;
}

export const DatePicker = ({
  date,
  setSelectedDate,
  mode = "day",

  showDatePicker = true,
  customPicker,

  showPrevNextButtons = true,
  showTodayButton = true,

  prevLabel = "Previous",
  nextLabel = "Next",
  todayLabel = "Today",
}: DatePickerProps) => {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Step logic (day = 1, week = 7)
  const step = mode === "day" ? 1 : 7;

  const goToPrevious = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - step);
      return d;
    });
  };

  const goToNext = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + step);
      return d;
    });
  };

  const goToToday = () => setSelectedDate(new Date());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setDatePickerOpen(false);
  };

  // Label formatting depending on mode
  const formatLabel = (date: Date, mode: DatePickerMode) => {
    if (mode === "day") {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    if (mode === "week") {
      const start = new Date(date);
      const end = new Date(date);

      // Week starts on Sunday (or adjust as needed)
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);

      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} – ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    return "";
  };

  const formattedDate = formatLabel(new Date(date), mode);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as HTMLElement)
      ) {
        setDatePickerOpen(false);
      }
    }

    if (datePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datePickerOpen]);

  return (
    <div className="p-2 sm:p-4 bg-olive-50 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-0">
      <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-2">
        {/* PREV / NEXT BUTTONS */}
        {showPrevNextButtons && (
          <>
            <Button
              variant="ghost"
              onClick={goToPrevious}
              icon={ChevronLeft}
              size="sm"
            >
              {prevLabel}
            </Button>

            {showTodayButton && (
              <Button variant="secondary" size="sm" onClick={goToToday}>
                {todayLabel}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={goToNext}
              icon={ChevronRight}
              size="sm"
            >
              {nextLabel}
            </Button>
          </>
        )}
      </div>

      {/* DATE LABEL + PICKER */}
      <div className="relative" ref={datePickerRef}>
        <Button
          variant="ghost"
          onClick={() => setDatePickerOpen(!datePickerOpen)}
          className="font-medium flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {formattedDate}
        </Button>

        {datePickerOpen && showDatePicker && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white shadow-md rounded-md p-2 z-10 w-max">
            {customPicker ? (
              customPicker
            ) : (
              <input
                type="date"
                value={date}
                onChange={handleDateChange}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!target.value) target.value = date;
                }}
                className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-olive-200"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

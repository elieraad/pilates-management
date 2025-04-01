import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "./button";

export const DatePicker = ({
  date,
  setSelectedDate,
}: {
  date: string;
  setSelectedDate: (newDate: Date | ((prevDate: Date) => Date)) => void;
}) => {
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // Optimized date selection functions (with useCallback)
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setDatePickerOpen(false);
  };

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
        <Button
          variant="ghost"
          onClick={goToPreviousDay}
          icon={ChevronLeft}
          size="sm"
        >
          Previous
        </Button>

        <Button variant="secondary" size="sm" onClick={goToToday}>
          Today
        </Button>

        <Button
          variant="ghost"
          onClick={goToNextDay}
          icon={ChevronRight}
          size="sm"
        >
          Next
        </Button>
      </div>

      <div className="relative" ref={datePickerRef}>
        <Button
          variant="ghost"
          onClick={() => setDatePickerOpen(!datePickerOpen)}
          className="font-medium flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {formattedDate}
        </Button>

        {datePickerOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white shadow-md rounded-md p-2 z-10 w-max">
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                if (!target.value) {
                  target.value = date; // Reset if cleared
                }
              }}
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-olive-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};

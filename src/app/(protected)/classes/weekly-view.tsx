"use client";

import { Class, ClassSession } from "@/types/class.types";
import {
  addDays,
  differenceInCalendarDays,
  format,
  compareAsc,
  addMinutes,
} from "date-fns";

const HOUR_ROW_HEIGHT = 150;

type WeeklyCalendarViewProps = {
  filteredClasses: Class[];
  sessionsByClass: Record<string, ClassSession[]>;
  startOfWeek: Date;
  endOfWeek: Date;
  onBook: (session: ClassSession) => void;
};

// Helper to calculate overlapping session layout
const calculateSessionLayout = (sessions: ClassSession[]) => {
  const layoutMap = new Map<string, { column: number; totalColumns: number }>();

  const sorted = [...sessions].sort((a, b) =>
    compareAsc(new Date(a.start_time), new Date(b.start_time))
  );

  const columns: ClassSession[][] = [];

  sorted.forEach((session) => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const lastInColumn = column[column.length - 1];
      if (
        new Date(session.start_time) >=
        addMinutes(
          new Date(lastInColumn.start_time),
          lastInColumn.class.duration
        )
      ) {
        column.push(session);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([session]);
    }
  });

  // Assign layout info
  columns.forEach((column, colIndex) => {
    column.forEach((session) => {
      layoutMap.set(session.id, {
        column: colIndex,
        totalColumns: columns.length,
      });
    });
  });

  return layoutMap;
};

// Helper to get session position and height
const getSessionPosition = (session: ClassSession, earliestHour: number) => {
  const start = new Date(session.start_time);
  const end = addMinutes(new Date(session.start_time), session.class.duration);

  const minutesFromStart =
    (start.getHours() - earliestHour) * 60 + start.getMinutes();
  const top = (minutesFromStart / 60) * HOUR_ROW_HEIGHT;

  const durationMinutes =
    (end.getHours() - start.getHours()) * 60 +
    (end.getMinutes() - start.getMinutes());
  const height = Math.max((durationMinutes / 60) * HOUR_ROW_HEIGHT - 4, 40);

  return { top, height };
};

// Helper to find the hour range needed for display
const getHourRange = (sessionsMap: Record<string, ClassSession[]>) => {
  let earliestHour = 22;
  let latestHour = 6;

  Object.values(sessionsMap).forEach((sessions) => {
    sessions.forEach((session) => {
      const startHour = new Date(session.start_time).getHours();
      const endTime = addMinutes(
        new Date(session.start_time),
        session.class.duration
      );
      const endHour = endTime.getHours();

      earliestHour = Math.min(earliestHour, startHour);
      latestHour = Math.max(latestHour, endHour);
    });
  });

  earliestHour = Math.max(6, earliestHour - 1);
  latestHour = Math.min(22, latestHour + 1);

  if (earliestHour > latestHour) {
    earliestHour = 6;
    latestHour = 22;
  }

  return { earliestHour, latestHour };
};

export const WeeklyCalendarView = ({
  filteredClasses,
  sessionsByClass,
  startOfWeek,
  endOfWeek,
  onBook,
}: WeeklyCalendarViewProps) => {
  const daysCount = differenceInCalendarDays(endOfWeek, startOfWeek) + 1;
  const daysOfWeek = Array.from({ length: daysCount }).map((_, i) =>
    addDays(startOfWeek, i)
  );

  // Map sessions by day
  const sessionsMap: Record<string, ClassSession[]> = {};
  daysOfWeek.forEach((day) => {
    const dayKey = day.toDateString();
    sessionsMap[dayKey] = [];
    filteredClasses.forEach((cls) => {
      const classSessions = sessionsByClass[cls.id]?.filter(
        (s) => new Date(s.start_time).toDateString() === dayKey
      );
      if (classSessions) {
        sessionsMap[dayKey].push(...classSessions);
      }
    });
    sessionsMap[dayKey].sort((a, b) =>
      compareAsc(new Date(a.start_time), new Date(b.start_time))
    );
  });

  // Get the dynamic hour range
  const { earliestHour, latestHour } = getHourRange(sessionsMap);
  const hours = Array.from(
    { length: latestHour - earliestHour + 1 },
    (_, i) => earliestHour + i
  );

  // Calculate layouts for each day
  const layoutMaps: Record<
    string,
    Map<string, { column: number; totalColumns: number }>
  > = {};
  daysOfWeek.forEach((day) => {
    const dayKey = day.toDateString();
    layoutMaps[dayKey] = calculateSessionLayout(sessionsMap[dayKey]);
  });

  // Calculate max columns per day for dynamic sizing
  const maxColumnsPerDay: Record<string, number> = {};
  daysOfWeek.forEach((day) => {
    const dayKey = day.toDateString();
    const layouts = Array.from(layoutMaps[dayKey].values());
    maxColumnsPerDay[dayKey] = Math.max(
      1,
      ...layouts.map((l) => l.totalColumns)
    );
  });

  // Calculate dynamic min-width for day columns
  const getColumnWidth = (dayKey: string) => {
    const columns = maxColumnsPerDay[dayKey];
    if (columns <= 1) return 120;
    if (columns === 2) return 180;
    if (columns === 3) return 240;
    return 80 * columns;
  };

  const totalWidth = daysOfWeek.reduce((sum, day) => {
    return sum + getColumnWidth(day.toDateString());
  }, 80);

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:flex border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Fixed Time Column */}
        <div className="flex-shrink-0 border-r">
          <div className="bg-gray-50 p-2 text-xs text-gray-500 font-medium w-16 h-[52px] flex items-center justify-center">
            Time
          </div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-t p-2 text-right text-xs text-gray-500 bg-gray-50 w-16"
              style={{ height: HOUR_ROW_HEIGHT, borderTopStyle: "dashed" }}
            >
              <span className="font-medium">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Scrollable Days */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="flex w-full"
            style={{ minWidth: `${Math.max(totalWidth - 80, 100)}px` }}
          >
            {daysOfWeek.map((day) => {
              const dayKey = day.toDateString();

              return (
                <div
                  key={dayKey}
                  className="relative flex-1"
                  style={{ minWidth: `${getColumnWidth(dayKey)}px` }}
                >
                  {/* Day Header */}
                  <div className="border-l bg-gray-50 p-2 text-center h-[52px]">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">
                      {format(day, "EEE")}
                    </p>
                    <p className="font-semibold text-olive-900 text-sm">
                      {format(day, "d MMM")}
                    </p>
                  </div>

                  {/* Sessions Layer - positioned absolutely over all hours */}
                  <div className="absolute top-[52px] left-0 right-0 bottom-0 pointer-events-none z-10">
                    {sessionsMap[dayKey].map((session) => {
                      const { top, height } = getSessionPosition(
                        session,
                        earliestHour
                      );
                      const layout = layoutMaps[dayKey].get(session.id);
                      const totalColumns = layout?.totalColumns || 1;
                      const width = layout ? 100 / layout.totalColumns : 100;
                      const left = layout
                        ? (layout.column * 100) / layout.totalColumns
                        : 0;

                      const isNarrow = totalColumns > 2;
                      const isFull =
                        session.bookings_count >= session.class.capacity;

                      return (
                        <div
                          key={session.id}
                          className={`absolute rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:z-30 overflow-hidden pointer-events-auto
                ${
                  session.is_cancelled
                    ? "bg-red-100 text-red-700"
                    : isFull
                    ? "bg-gray-100 text-gray-600"
                    : "bg-olive-50 text-olive-900 hover:bg-olive-100"
                }
                ${isNarrow ? "p-1" : "p-2"}`}
                          style={{
                            top: `${top + 3}px`,
                            height: `${height - 2}px`,
                            width: `calc(${width}% - ${"6px"})`,
                            left: `calc(3.5px + ${left}%)`,
                            minWidth: totalColumns > 3 ? "70px" : "auto",
                          }}
                          onClick={() => onBook(session)}
                          title={`${session.class.name} - ${format(
                            new Date(session.start_time),
                            "HH:mm"
                          )} with ${session.class.instructor} (${
                            session.bookings_count
                          }/${session.class.capacity})`}
                        >
                          <div
                            className={`h-full flex flex-col justify-between ${
                              isNarrow ? "text-[10px]" : "text-xs"
                            }`}
                          >
                            <div>
                              <p
                                className={`font-semibold leading-tight line-clamp-2 ${
                                  isNarrow ? "mb-0.5" : "mb-1"
                                }`}
                              >
                                {session.class.name}
                              </p>
                              {!isNarrow && (
                                <p className="text-[10px] opacity-70 mb-1">
                                  {session.class.instructor}
                                </p>
                              )}
                            </div>
                            <div className="leading-tight">
                              <p
                                className={`font-semibold ${
                                  isFull ? "text-red-600" : "text-olive-700"
                                }`}
                              >
                                {session.bookings_count}/
                                {session.class.capacity}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hour Cells */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-t border-l relative bg-white hover:bg-gray-50 transition-colors"
                      style={{
                        height: HOUR_ROW_HEIGHT,
                        borderTopStyle: "dashed",
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile stacked view */}
      <div className="md:hidden flex flex-col space-y-3">
        {daysOfWeek.map((day) => {
          const dayKey = day.toDateString();
          const daySessions = sessionsMap[dayKey];

          return (
            <div
              key={dayKey}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
            >
              {/* Day header */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">
                    {format(day, "EEE")}
                  </p>
                  <p className="font-semibold text-olive-900 text-base">
                    {format(day, "d MMM")}
                  </p>
                </div>
              </div>

              {/* Sessions */}
              {daySessions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No sessions
                </p>
              ) : (
                <div className="flex flex-col space-y-2">
                  {daySessions.map((session) => {
                    const isFull =
                      session.bookings_count >= session.class.capacity;
                    return (
                      <div
                        key={session.id}
                        className={`rounded-lg p-3 shadow-sm cursor-pointer text-xs transition-all active:scale-[0.98]
                        ${
                          session.is_cancelled
                            ? "bg-red-100 text-red-700 line-through"
                            : isFull
                            ? "bg-gray-100 text-gray-600"
                            : "bg-olive-50 text-olive-900 hover:bg-olive-100 active:bg-olive-200"
                        }`}
                        onClick={() => onBook(session)}
                      >
                        <p className="font-semibold text-sm mb-1">
                          {session.class.name}
                        </p>
                        <p className="text-xs opacity-70 mb-1">
                          {session.class.instructor}
                        </p>
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs font-semibold ${
                              isFull ? "text-red-600" : "text-olive-700"
                            }`}
                          >
                            {session.bookings_count}/{session.class.capacity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

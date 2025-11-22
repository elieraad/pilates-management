import { Table } from "@/components/ui/table";
import Button from "@/components/ui/button";
import { Class, ClassSession } from "@/types/class.types";
import { ClassCard } from "@/components/classes/class-card";
import { SessionRow } from "@/components/classes/session-row";

type DailyViewInputProps = {
  filteredClasses: Class[];
  sessionsByClass: Record<string, ClassSession[]>;
  formattedDate: string;
  onAddClass: (cls: Class) => void;
  onEditClass: (cls: Class) => void;
  onDeleteClass: (cls: Class) => void;
  onBook: (session: ClassSession) => void;
  onCancelOccurrence: (session: ClassSession) => void;
  onDeleteSeries: (session: ClassSession) => void;
  onEditSeries: (session: ClassSession) => void;
  onModifyOccurrence: (session: ClassSession) => void;
};
export const DailyView = ({
  filteredClasses,
  sessionsByClass,
  formattedDate,
  onBook,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onCancelOccurrence,
  onDeleteSeries,
  onEditSeries,
  onModifyOccurrence,
}: DailyViewInputProps) => {
  return (
    <div className="space-y-8">
      {Object.keys(sessionsByClass).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No classes scheduled for {formattedDate}
          </p>
          <Button variant="secondary" className="mt-4">
            Add a class
          </Button>
        </div>
      )}

      {filteredClasses
        .filter((cls) => sessionsByClass[cls.id])
        .map((cls) => (
          <div
            key={cls.id}
            className="border border-gray-100 rounded-lg overflow-hidden"
          >
            <ClassCard
              cls={cls}
              onAddClass={onAddClass}
              onEditClass={onEditClass}
              onDeleteClass={onDeleteClass}
            />

            <div className="p-4">
              {!sessionsByClass[cls.id]?.length ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No sessions scheduled</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => onAddClass(cls)}
                  >
                    Add Session
                  </Button>
                </div>
              ) : (
                <Table
                  headers={[
                    "Date",
                    "Time",
                    "Recurring",
                    "Bookings",
                    "Status",
                    "Actions",
                  ]}
                >
                  {sessionsByClass[cls.id].map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      onBook={onBook}
                      onCancelOccurrence={onCancelOccurrence}
                      onModifyOccurrence={onModifyOccurrence}
                      onDeleteSeries={onDeleteSeries}
                      onEditSeries={onEditSeries}
                    />
                  ))}
                </Table>
              )}
            </div>
          </div>
        ))}
    </div>
  );
};

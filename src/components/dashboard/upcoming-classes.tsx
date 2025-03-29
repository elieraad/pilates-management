"use client";

import { Table, TableRow, TableCell } from "../ui/table";
import { useRouter } from "next/navigation";
import { ClassSession } from "@/types/class.types";
import Button from "../ui/button";
import { formatTime } from "@/lib/utils/date-utils";

type UpcomingClassesProps = {
  classes: ClassSession[];
};

const UpcomingClasses = ({ classes }: UpcomingClassesProps) => {
  const router = useRouter();

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg">
        <p className="text-gray-600">No upcoming classes scheduled.</p>
        <Button
          variant="secondary"
          onClick={() => router.push("/classes")}
          className="mt-4"
        >
          Manage Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-serif text-olive-900">{`Today's Classes`}</h2>
        <button
          className="text-olive-600 text-sm font-medium flex items-center"
          onClick={() => router.push("/classes")}
        >
          View All Classes
        </button>
      </div>

      <Table headers={["Class", "Time", "Instructor", "Bookings"]}>
        {classes.slice(0, 3).map((cls) => (
          <TableRow key={cls.id}>
            <TableCell className="font-medium">{cls.class.name}</TableCell>
            <TableCell className="text-gray-600">
              {formatTime(cls.start_time)}
            </TableCell>
            <TableCell className="text-gray-600">
              {cls.class.instructor}
            </TableCell>
            <TableCell>
              <span
                className={`font-medium ${
                  cls.bookings_count >= cls.class.capacity
                    ? "text-olive-600"
                    : "text-gray-700"
                }`}
              >
                {cls.bookings_count}/{cls.class.capacity}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
};

export default UpcomingClasses;

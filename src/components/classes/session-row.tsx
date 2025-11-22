import { FC } from "react";
import Button from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { ClassSession } from "@/types/class.types";
import { formatDate, formatTime } from "@/lib/utils/date-utils";
import { ActionsMenu } from "@/components/classes/actions-menu";

type Props = {
  session: ClassSession;
  onBook: (session: ClassSession) => void;
  onCancelOccurrence: (session: ClassSession) => void;
  onDeleteSeries: (session: ClassSession) => void;
  onEditSeries: (session: ClassSession) => void;
  onModifyOccurrence: (session: ClassSession) => void;
};

export const SessionRow: FC<Props> = ({
  session,
  onBook,
  onCancelOccurrence,
  onDeleteSeries,
  onEditSeries,
  onModifyOccurrence,
}) => (
  <TableRow className="hover:bg-olive-50">
    <TableCell>{formatDate(session.start_time)}</TableCell>
    <TableCell>{formatTime(session.start_time)}</TableCell>

    <TableCell>
      {session.is_recurring ? (
        <span className="text-olive-600 font-medium">
          {session.recurring_pattern}
          {session.is_exception && (
            <span className="text-amber-600"> (Modified)</span>
          )}
          {!session.is_exception && session.is_recurring && (
            <span className="text-gray-400"> (Recurring)</span>
          )}
        </span>
      ) : (
        <span className="text-gray-500">No</span>
      )}
    </TableCell>

    <TableCell>
      <span
        className={
          session.bookings_count >= session.class.capacity
            ? "text-olive-600 font-medium"
            : "text-gray-600"
        }
      >
        {session.bookings_count}/{session.class.capacity}
      </span>
    </TableCell>

    <TableCell>
      {session.is_cancelled ? (
        <span className="text-red-600 font-medium">Cancelled</span>
      ) : (
        <span className="text-green-600 font-medium">Active</span>
      )}
    </TableCell>

    <TableCell className="text-right">
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onBook(session)}
          disabled={
            session.bookings_count >= session.class.capacity ||
            session.is_cancelled
          }
        >
          {session.bookings_count >= session.class.capacity ? "Full" : "Book"}
        </Button>

        {/* More Actions Dropdown with cascading menus */}
        <ActionsMenu
          session={session}
          handleCancelOccurrence={onCancelOccurrence}
          handleDeleteSeries={onDeleteSeries}
          handleEditSeries={onEditSeries}
          handleModifyOccurrence={onModifyOccurrence}
        />
      </div>
    </TableCell>
  </TableRow>
);

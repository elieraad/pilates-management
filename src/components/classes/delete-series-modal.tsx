"use client";

import { ClassSession } from "@/types/class.types";
import Modal from "../ui/modal";
import Button from "../ui/button";
import { formatTime } from "@/lib/utils/date-utils";
import { useClasses } from "@/lib/hooks/use-classes";

interface DeleteSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession | null;
  onSuccess: () => void;
}

const DeleteSeriesModal = ({
  isOpen,
  onClose,
  session,
  onSuccess,
}: DeleteSeriesModalProps) => {
  const { useDeleteSessionSeriesMutation } = useClasses();
  const deleteSeries = useDeleteSessionSeriesMutation();

  const handleDeleteSeries = async () => {
    if (!session) return;

    try {
      const parentId = session.id;
      await deleteSeries.mutateAsync(parentId);
      onSuccess();
    } catch (error) {
      console.error("Error deleting series:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Recurring Session Series"
    >
      {session && (
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to delete the entire recurring session series. This
            will cancel all future occurrences of this series.
          </p>

          <div className="bg-olive-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-1">Session Details</h3>
            <p>
              <strong>Class:</strong> {session.class.name}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(session.start_time)}
            </p>
            <p>
              <strong>Pattern:</strong> {session.recurring_pattern || "weekly"}
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-red-700">
              <strong>Warning:</strong> This will cancel all future occurrences
              of this recurring session series. Any bookings for future sessions
              in this series will also be cancelled.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={deleteSeries.isPending}
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              isLoading={deleteSeries.isPending}
              onClick={handleDeleteSeries}
            >
              Delete Entire Series
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DeleteSeriesModal;

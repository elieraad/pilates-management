"use client";

import { useEffect, useState } from "react";
import { ClassSession } from "@/types/class.types";
import Modal from "../ui/modal";
import Button from "../ui/button";
import { formatTime } from "@/lib/utils/date-utils";
import { useClasses } from "@/lib/hooks/use-classes";

interface EditSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSession | null;
  onSuccess: () => void;
}

const EditSeriesModal = ({
  isOpen,
  onClose,
  session,
  onSuccess,
}: EditSeriesModalProps) => {
  const { useUpdateSessionSeriesMutation } = useClasses();
  const updateSeries = useUpdateSessionSeriesMutation();

  const [newStartTime, setNewStartTime] = useState<string>("");
  const [recurringPattern, setRecurringPattern] = useState<string>(
    session?.recurring_pattern || "weekly"
  );

  // Set initial values when the session changes - using useEffect to update
  useEffect(() => {
    if (session && session.start_time) {
      const time = new Date(session.start_time)
        .toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
        .slice(0, 5);
      setNewStartTime(time);
      setRecurringPattern(session.recurring_pattern || "weekly");
    }
  }, [session]);

  const handleUpdateSeries = async () => {
    if (!session) return;

    try {
      // Extract hours and minutes from the time input
      const [hours, minutes] = newStartTime.split(":").map(Number);

      // Create a new date object based on the original date but with the new time
      const originalDate = new Date(session.start_time);
      const updatedDateTime = new Date(originalDate);
      updatedDateTime.setHours(hours, minutes, 0, 0);

      await updateSeries.mutateAsync({
        sessionId: session.id,
        updateData: {
          start_time: updatedDateTime.toISOString(),
          recurring_pattern: recurringPattern,
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating series:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Recurring Session Series"
    >
      {session && (
        <div className="space-y-4">
          <p className="text-gray-600">
            You are editing the entire recurring session series. This will
            affect all future occurrences of this series.
          </p>

          <div className="bg-olive-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-1">Session Details</h3>
            <p>
              <strong>Class:</strong> {session.class.name}
            </p>
            <p>
              <strong>Current Time:</strong> {formatTime(session.start_time)}
            </p>
            <p>
              <strong>Current Pattern:</strong>{" "}
              {session.recurring_pattern || "weekly"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                New Time
              </label>
              <input
                type="time"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Recurrence Pattern
              </label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                value={recurringPattern}
                onChange={(e) => setRecurringPattern(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <p className="text-amber-700">
              <strong>Note:</strong> Editing this series will affect all future
              occurrences. Any exceptions you've previously created will remain
              intact.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updateSeries.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={updateSeries.isPending}
              onClick={handleUpdateSeries}
            >
              Update Series
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditSeriesModal;

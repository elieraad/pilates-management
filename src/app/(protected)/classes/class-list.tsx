"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class, ClassSession } from "@/types/class.types";
import { Search, Plus, Calendar, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils/date-utils";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";

import ClassSessionForm from "@/components/classes/class-session-form";
import ClassWizard from "@/components/classes/class-wizard";
import EditSeriesModal from "@/components/classes/edit-series-modal";
import DeleteSeriesModal from "@/components/classes/delete-series-modal";
import { DatePicker } from "@/components/ui/date-picker";
import { DailyView } from "./daily-view";
import { ClassCard } from "@/components/classes/class-card";
import { startOfWeek, endOfWeek } from "date-fns";

const ClassList = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"daily" | "all-classes">("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  // Date handling for pagination
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const storedDate = localStorage.getItem("selectedClassDate");

    if (storedDate) {
      const parsedDate = new Date(storedDate);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  useEffect(
    () => localStorage.setItem("selectedClassDate", selectedDate.toISOString()),
    [selectedDate]
  );

  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    setShowEditClassModal(true);
  };

  const handleDeleteClass = (cls: Class) => {
    setSelectedClass(cls);
    setConfirmDeleteModal(true);
  };

  const onAddClass = (cls: Class) => {
    setSelectedClass(cls);
    setShowAddSessionModal(true);
  };

  const confirmDeleteClass = async () => {
    if (selectedClass) {
      try {
        await deleteClass.mutateAsync(selectedClass.id);
        setConfirmDeleteModal(false);
        setSelectedClass(null);
      } catch (error) {
        console.error("Delete class error:", error);
      }
    }
  };

  // Format date for display and input
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dateInputValue = selectedDate.toISOString().split("T")[0];

  const [selectedOccurrence, setSelectedOccurrence] =
    useState<ClassSession | null>(null);
  const [showModifyOccurrenceModal, setShowModifyOccurrenceModal] =
    useState(false);
  const [showCancelOccurrenceModal, setShowCancelOccurrenceModal] =
    useState(false);

  // New state for series modals
  const [showEditSeriesModal, setShowEditSeriesModal] = useState(false);
  const [showDeleteSeriesModal, setShowDeleteSeriesModal] = useState(false);

  // Get the date range for the selected day (or week, depending on your UI)
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const {
    useClassesQuery,
    useClassSessionsQuery,
    useDeleteClassMutation,
    useModifySessionOccurrenceMutation,
    useCancelSessionOccurrenceMutation,
    useDeleteSessionSeriesMutation,
    useUpdateSessionSeriesMutation,
  } = useClasses();

  const startISO = useMemo(() => weekStart.toISOString(), [weekStart]);
  const endISO = useMemo(() => weekEnd.toISOString(), [weekEnd]);

  // Fetch sessions with date range
  const { data: classes, isLoading: isLoadingClasses } = useClassesQuery();
  const { data: sessions, isLoading: isLoadingSessions } =
    useClassSessionsQuery(startISO, endISO);

  // Filter classes by search term
  const filteredClasses = classes?.filter((cls) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      cls.name.toLowerCase().includes(searchLower) ||
      cls.instructor.toLowerCase().includes(searchLower)
    );
  });

  // Filter sessions based on active tab and selected date
  // Optimized filtering for sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    return sessions.filter((session) => {
      const sessionDate = new Date(session.start_time);

      if (activeTab === "daily") {
        // Check if session is on the selected date
        return (
          sessionDate.getDate() === selectedDate.getDate() &&
          sessionDate.getMonth() === selectedDate.getMonth() &&
          sessionDate.getFullYear() === selectedDate.getFullYear() &&
          !session.is_cancelled
        );
      } else if (activeTab === "all-classes") {
        return true;
      }
      return false;
    });
  }, [sessions, activeTab, selectedDate]);

  // Memoize session grouping to avoid recalculating on every render
  const sessionsByClass = useMemo(() => {
    if (!filteredSessions) return {};

    const groupedSessions: Record<string, ClassSession[]> = {};

    filteredSessions.forEach((session) => {
      if (!groupedSessions[session.class_id]) {
        groupedSessions[session.class_id] = [];
      }
      groupedSessions[session.class_id].push(session);
    });

    // Pre-sort sessions by time for each class
    Object.keys(groupedSessions).forEach((classId) => {
      groupedSessions[classId].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return groupedSessions;
  }, [filteredSessions]);

  const deleteClass = useDeleteClassMutation();
  const modifyOccurrence = useModifySessionOccurrenceMutation();
  const cancelOccurrence = useCancelSessionOccurrenceMutation();
  const modifySession = useUpdateSessionSeriesMutation();
  const cancelSession = useDeleteSessionSeriesMutation();

  // Handle modifying a single occurrence
  const handleModifyOccurrence = (session: ClassSession) => {
    setSelectedOccurrence(session);
    setShowModifyOccurrenceModal(true);
  };

  // Handle canceling a single occurrence
  const handleCancelOccurrence = (session: ClassSession) => {
    setSelectedOccurrence(session);
    setShowCancelOccurrenceModal(true);
  };

  // Handle editing the entire series
  const handleEditSeries = (session: ClassSession) => {
    setSelectedOccurrence(session);
    setShowEditSeriesModal(true);
  };

  // Handle deleting the entire series
  const handleDeleteSeries = (session: ClassSession) => {
    setSelectedOccurrence(session);
    setShowDeleteSeriesModal(true);
  };

  const confirmModifyOccurrence = async (newStartTime: string) => {
    if (!selectedOccurrence) {
      return;
    }

    try {
      if (selectedOccurrence.is_recurring) {
        await modifyOccurrence.mutateAsync({
          recurringSessionId: selectedOccurrence.id,
          originalDate: selectedOccurrence.original_date,
          newStartTime,
        });
      } else {
        await modifySession.mutateAsync({
          sessionId: selectedOccurrence.id,
          updateData: {
            start_time: newStartTime,
          },
        });
      }

      setShowModifyOccurrenceModal(false);
      setSelectedOccurrence(null);
    } catch (error) {
      console.error("Error modifying occurrence:", error);
    }
  };

  const confirmCancelOccurrence = async () => {
    if (!selectedOccurrence) {
      return;
    }

    try {
      if (selectedOccurrence.is_recurring) {
        await cancelOccurrence.mutateAsync({
          recurringSessionId: selectedOccurrence.id,
          originalDate: selectedOccurrence.original_date,
        });
      } else {
        await cancelSession.mutateAsync(selectedOccurrence.id);
      }

      setShowCancelOccurrenceModal(false);
      setSelectedOccurrence(null);
    } catch (error) {
      console.error("Error canceling occurrence:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif text-olive-900">Class Schedule</h2>
        <Button onClick={() => setShowAddClassModal(true)} icon={Plus}>
          Add New Class
        </Button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-2">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "daily"
                  ? "text-olive-600 border-b-2 border-olive-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("daily")}
            >
              <Calendar className="h-4 w-4 inline-block mr-1" />
              Daily View
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === "all-classes"
                  ? "text-olive-600 border-b-2 border-olive-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("all-classes")}
            >
              <Users className="h-4 w-4 inline-block mr-1" />
              All Classes
            </button>
          </div>
        </div>

        {activeTab === "daily" && (
          <DatePicker
            date={dateInputValue}
            setSelectedDate={(x) => setSelectedDate(x)}
          />
        )}

        <div className="p-4">
          <div className="flex mb-4">
            <div className="relative flex-1 mr-4">
              <input
                type="text"
                placeholder="Search classes..."
                className="w-full p-2 pl-8 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {isLoadingClasses || isLoadingSessions ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading classes...</p>
            </div>
          ) : filteredClasses && filteredClasses.length > 0 ? (
            <div className="space-y-8">
              {/* All Classes View */}
              {activeTab === "all-classes" && (
                <div className="space-y-4">
                  {filteredClasses.map((cls) => {
                    return (
                      <div
                        key={cls.id}
                        className="border border-gray-100 rounded-lg overflow-hidden mb-4 shadow-sm"
                      >
                        <ClassCard
                          cls={cls}
                          onAddClass={onAddClass}
                          onDeleteClass={handleDeleteClass}
                          onEditClass={handleEditClass}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "daily" && (
                <DailyView
                  filteredClasses={filteredClasses.filter(
                    (cls) => sessionsByClass[cls.id]
                  )}
                  sessionsByClass={sessionsByClass}
                  formattedDate={formattedDate}
                  onBook={(session: ClassSession) => {
                    const sessionDate = new Date(session.start_time);
                    const dateString = sessionDate.toISOString().split("T")[0];
                    router.push(
                      `/bookings/new?sessionId=${
                        session.id
                      }&sessionDate=${dateString}&time=${encodeURIComponent(
                        formatTime(session.start_time)
                      )}`
                    );
                  }}
                  onAddClass={onAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                  onCancelOccurrence={handleCancelOccurrence}
                  onDeleteSeries={handleDeleteSeries}
                  onEditSeries={handleEditSeries}
                  onModifyOccurrence={handleModifyOccurrence}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No classes found</p>
              <Button
                variant="secondary"
                onClick={() => setShowAddClassModal(true)}
                className="mt-4"
              >
                Create a class
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modify Series Modal */}
      <EditSeriesModal
        isOpen={showEditSeriesModal}
        onClose={() => setShowEditSeriesModal(false)}
        session={selectedOccurrence}
        onSuccess={() => {
          setShowEditSeriesModal(false);
          setSelectedOccurrence(null);
        }}
      ></EditSeriesModal>

      {/* Modify Occurrence Modal */}
      <Modal
        isOpen={showModifyOccurrenceModal}
        onClose={() => setShowModifyOccurrenceModal(false)}
        title="Modify Session Occurrence"
      >
        {selectedOccurrence && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You are modifying a single occurrence of a recurring session. This
              will not affect other occurrences in the series.
            </p>

            <div className="bg-olive-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-1">Session Details</h3>
              <p>
                <strong>Class:</strong> {selectedOccurrence.class.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {formatDate(selectedOccurrence.start_time)}
              </p>
              <p>
                <strong>Current Time:</strong>{" "}
                {formatTime(selectedOccurrence.start_time)}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                New Time
              </label>
              <input
                type="time"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
                defaultValue={new Date(selectedOccurrence.start_time)
                  .toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .slice(0, 5)}
                id="new_time"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowModifyOccurrenceModal(false)}
                disabled={modifyOccurrence.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={modifyOccurrence.isPending}
                onClick={() => {
                  const timeInput = document.getElementById(
                    "new_time"
                  ) as HTMLInputElement;
                  const newTime = timeInput.value;
                  if (!newTime) return;

                  // Create new datetime with the selected date but new time
                  const startTime = new Date(selectedOccurrence.start_time);
                  const [hours, minutes] = newTime.split(":").map(Number);
                  startTime.setHours(hours, minutes, 0, 0);

                  confirmModifyOccurrence(startTime.toISOString());
                }}
              >
                Modify Occurrence
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Series Modal */}
      <DeleteSeriesModal
        isOpen={showDeleteSeriesModal}
        onClose={() => setShowDeleteSeriesModal(false)}
        session={selectedOccurrence}
        onSuccess={() => {
          setShowDeleteSeriesModal(false);
          setSelectedOccurrence(null);
        }}
      ></DeleteSeriesModal>

      {/* Cancel Occurrence Modal */}
      <Modal
        isOpen={showCancelOccurrenceModal}
        onClose={() => setShowCancelOccurrenceModal(false)}
        title="Delete Session Occurrence"
      >
        {selectedOccurrence && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You are cancelling a single occurrence of a recurring session.
              This will not affect other occurrences in the series.
            </p>

            <div className="bg-olive-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-1">Session Details</h3>
              <p>
                <strong>Class:</strong> {selectedOccurrence.class.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {formatDate(selectedOccurrence.start_time)}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {formatTime(selectedOccurrence.start_time)}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-700">
                <strong>Warning:</strong> This will delete only this occurrence
                of the recurring session. Any bookings for this session will
                also be cancelled.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelOccurrenceModal(false)}
                disabled={cancelOccurrence.isPending}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                isLoading={cancelOccurrence.isPending}
                onClick={confirmCancelOccurrence}
              >
                Delete This Occurrence
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Class Modal */}
      <Modal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        title="Add New Class"
      >
        <ClassWizard onSuccess={() => setShowAddClassModal(false)} />
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditClassModal}
        onClose={() => setShowEditClassModal(false)}
        title="Edit Class"
      >
        {selectedClass && (
          <ClassWizard
            initialData={selectedClass}
            onSuccess={() => {
              setShowEditClassModal(false);
              setSelectedClass(null);
            }}
          />
        )}
      </Modal>

      {/* Add Session Modal */}
      <Modal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        title={`Add Session for ${selectedClass?.name}`}
      >
        {selectedClass && classes && (
          <ClassSessionForm
            classes={classes}
            selectedClassId={selectedClass.id}
            initialDate={selectedDate}
            onSuccess={() => {
              setShowAddSessionModal(false);
              setSelectedClass(null);
            }}
          />
        )}
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(false)}
        title="Delete Class"
      >
        <p className="mb-4">
          {`Are you sure you want to delete the class "${selectedClass?.name}"?
          This will also delete all associated sessions.`}
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setConfirmDeleteModal(false)}
            disabled={deleteClass.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            isLoading={deleteClass.isPending}
            onClick={confirmDeleteClass}
          >
            Delete Class
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClassList;

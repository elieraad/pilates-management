"use client";

import { useState } from "react";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class, RecurrenceOptions } from "@/types/class.types";
import Input from "../ui/input";
import Select from "../ui/select";
import Button from "../ui/button";
import { Plus, X, Calendar } from "lucide-react";

type ClassSessionFormProps = {
  classes: Class[];
  selectedClassId?: string;
  initialDate?: Date;
  onSuccess?: () => void;
};

const ClassSessionForm = ({
  classes,
  selectedClassId,
  initialDate,
  onSuccess,
}: ClassSessionFormProps) => {
  const { useCreateClassSessionMutation } = useClasses();
  const createClassSession = useCreateClassSessionMutation();

  // Format the initialDate to YYYY-MM-DD format for the input
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const [sessions, setSessions] = useState<
    {
      id: string;
      start_date: string;
      start_time: string;
      is_recurring: boolean;
      recurrence_options: RecurrenceOptions;
    }[]
  >([
    {
      id: crypto.randomUUID(),
      start_date:
        formatDateForInput(initialDate) || formatDateForInput(new Date()),
      start_time: "09:00",
      is_recurring: false,
      recurrence_options: {
        pattern: "weekly",
        endDate: null, // No end date by default
        daysOfWeek: [], // Empty means "same day as start_date"
      },
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    class_id: selectedClassId || "",
  });

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSessionChange = (
    sessionId: string,
    field: string,
    value: string | boolean
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, [field]: value } : session
      )
    );

    // Clear relevant errors
    if (errors[`session_${sessionId}_${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`session_${sessionId}_${field}`]: "",
      }));
    }
  };

  const handleRecurrenceChange = (
    sessionId: string,
    field: string,
    value: string | null
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              recurrence_options: {
                ...session.recurrence_options,
                [field]: value,
              },
            }
          : session
      )
    );
  };

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start_date: prev[0].start_date, // Copy date from first session
        start_time: "", // Empty time to force selection
        is_recurring: false,
        recurrence_options: {
          pattern: "weekly",
          endDate: null,
          daysOfWeek: [],
        },
      },
    ]);
  };

  const removeSession = (sessionId: string) => {
    if (sessions.length === 1) return; // Don't remove last session
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));

    // Clear any errors for this session
    const sessionErrors = Object.keys(errors).filter((key) =>
      key.startsWith(`session_${sessionId}`)
    );
    if (sessionErrors.length > 0) {
      const newErrors = { ...errors };
      sessionErrors.forEach((key) => {
        delete newErrors[key];
      });
      setErrors(newErrors);
    }
  };

  const toggleDayOfWeek = (sessionId: string, day: number) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const days = session.recurrence_options.daysOfWeek || [];
          const newDays = days.includes(day)
            ? days.filter((d) => d !== day)
            : [...days, day];

          return {
            ...session,
            recurrence_options: {
              ...session.recurrence_options,
              daysOfWeek: newDays,
            },
          };
        }
        return session;
      })
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }

    // Validate each session
    sessions.forEach((session) => {
      if (!session.start_date) {
        newErrors[`session_${session.id}_start_date`] = "Date is required";
      }

      if (!session.start_time) {
        newErrors[`session_${session.id}_start_time`] = "Time is required";
      }

      if (
        session.is_recurring &&
        session.recurrence_options.pattern === "custom" &&
        (!session.recurrence_options.daysOfWeek ||
          session.recurrence_options.daysOfWeek.length === 0)
      ) {
        newErrors[`session_${session.id}_daysOfWeek`] =
          "Select at least one day";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Process each session
      await Promise.all(
        sessions.map(async (session) => {
          const startDateTime = new Date(
            `${session.start_date}T${session.start_time}`
          );

          const endDateTime = new Date(
            `${session.recurrence_options.endDate}T${session.start_time}`
          );

          await createClassSession.mutateAsync({
            class_id: formData.class_id,
            start_time: startDateTime.toISOString(),
            is_recurring: session.is_recurring,
            recurring_pattern: session.is_recurring
              ? session.recurrence_options.pattern
              : undefined,
            recurring_end_date:
              session.is_recurring && session.recurrence_options.endDate
                ? endDateTime.toISOString()
                : undefined,
            custom_recurrence:
              session.is_recurring &&
              session.recurrence_options.pattern === "custom"
                ? {
                    pattern: "custom",
                    daysOfWeek: session.recurrence_options.daysOfWeek,
                  }
                : undefined,
          });
        })
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isLoading = createClassSession.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!selectedClassId && (
        <Select
          label="Class"
          name="class_id"
          options={[
            { value: "", label: "Select a class" },
            ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
          ]}
          value={formData.class_id}
          onChange={handleClassChange}
          error={errors.class_id}
          required
        />
      )}

      <h3 className="text-lg font-medium border-b pb-2 mb-4">
        Schedule Sessions
      </h3>

      {sessions.length === 0 ? (
        <div className="text-center bg-gray-50 p-6 rounded-lg mb-6">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Sessions Scheduled
          </h3>
          <p className="text-gray-500 mb-4">
            Add a session time to schedule this class
          </p>
          <Button onClick={addSession} variant="secondary" icon={Plus}>
            Add Session Time
          </Button>
        </div>
      ) : (
        <div>
          {sessions.map((session, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg relative mb-4"
            >
              {sessions.length > 1 && (
                <button
                  type="button"
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  onClick={() => removeSession(session.id)}
                >
                  <X size={16} />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Date"
                  type="date"
                  value={session.start_date}
                  onChange={(e) =>
                    handleSessionChange(
                      session.id,
                      "start_date",
                      e.target.value
                    )
                  }
                  error={errors[`session_${session.id}_start_date`]}
                  required
                />

                <Input
                  label="Time"
                  type="time"
                  value={session.start_time}
                  onChange={(e) =>
                    handleSessionChange(
                      session.id,
                      "start_time",
                      e.target.value
                    )
                  }
                  error={errors[`session_${session.id}_start_time`]}
                  required
                />
              </div>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id={`recurring_${session.id}`}
                  className="mr-2"
                  checked={session.is_recurring}
                  onChange={(e) =>
                    handleSessionChange(
                      session.id,
                      "is_recurring",
                      e.target.checked
                    )
                  }
                />
                <label
                  htmlFor={`recurring_${session.id}`}
                  className="text-gray-700"
                >
                  Make this a recurring session
                </label>
              </div>

              {session.is_recurring && (
                <div className="space-y-4 pl-6 border-l-2 border-olive-100">
                  <Select
                    label="Recurring Pattern"
                    options={[
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "biweekly", label: "Every Two Weeks" },
                      { value: "monthly", label: "Monthly" },
                      { value: "custom", label: "Custom" },
                    ]}
                    value={session.recurrence_options.pattern}
                    onChange={(e) =>
                      handleRecurrenceChange(
                        session.id,
                        "pattern",
                        e.target.value
                      )
                    }
                  />

                  {session.recurrence_options.pattern === "custom" && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Select Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day, i) => (
                            <button
                              key={day}
                              type="button"
                              className={`py-1 px-3 rounded-full text-sm ${
                                session.recurrence_options.daysOfWeek?.includes(
                                  i
                                )
                                  ? "bg-olive-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                              onClick={() => toggleDayOfWeek(session.id, i)}
                            >
                              {day}
                            </button>
                          )
                        )}
                      </div>
                      {errors[`session_${session.id}_daysOfWeek`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`session_${session.id}_daysOfWeek`]}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`no_end_date_${session.id}`}
                        className="mr-2"
                        checked={!session.recurrence_options.endDate}
                        onChange={(e) =>
                          handleRecurrenceChange(
                            session.id,
                            "endDate",
                            e.target.checked
                              ? null
                              : formatDateForInput(
                                  new Date(
                                    Date.now() + 30 * 24 * 60 * 60 * 1000
                                  )
                                )
                          )
                        }
                      />
                      <label
                        htmlFor={`no_end_date_${session.id}`}
                        className="text-gray-700 text-sm"
                      >
                        Recurring indefinitely (no end date)
                      </label>
                    </div>

                    {session.recurrence_options.endDate && (
                      <Input
                        label="End Date"
                        type="date"
                        value={session.recurrence_options.endDate}
                        onChange={(e) =>
                          handleRecurrenceChange(
                            session.id,
                            "endDate",
                            e.target.value
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addSession}
            icon={Plus}
            className="w-full"
          >
            Add Another Session Time
          </Button>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={sessions.length === 0}
        >
          {sessions.length > 1 ? "Create Sessions" : "Create Session"}
        </Button>
      </div>
    </form>
  );
};

export default ClassSessionForm;

"use client";

import { useState } from "react";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class, RecurrenceOptions } from "@/types/class.types";
import Input from "../ui/input";
import Button from "../ui/button";
import { Plus, X, Calendar, ArrowRight, ArrowLeft, Check } from "lucide-react";
import Select from "../ui/select";

type ClassWizardProps = {
  initialData?: Class;
  initialDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const ClassWizard = ({
  initialData,
  initialDate,
  onSuccess,
  onCancel,
}: ClassWizardProps) => {
  // Wizard step state
  const [step, setStep] = useState(1);
  const [newClassId, setNewClassId] = useState<string | null>(null);

  const {
    useCreateClassMutation,
    useUpdateClassMutation,
    useCreateClassSessionMutation,
  } = useClasses();

  const createClass = useCreateClassMutation();
  const updateClass = useUpdateClassMutation();
  const createSession = useCreateClassSessionMutation();

  // Format the initialDate to YYYY-MM-DD format for the input
  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Class data
  const [classData, setClassData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    duration: initialData?.duration || 60,
    capacity: initialData?.capacity || 10,
    price: initialData?.price || 25,
    instructor: initialData?.instructor || "",
  });

  // Session data
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
      start_date: formatDateForInput(initialDate) || "",
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
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>(
    {}
  );

  const handleClassDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClassData((prev) => ({ ...prev, [name]: value }));
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
    if (sessionErrors[`session_${sessionId}_${field}`]) {
      setSessionErrors((prev) => ({
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
    const currentSessionErrors = Object.keys(sessionErrors).filter((key) =>
      key.startsWith(`session_${sessionId}`)
    );
    if (currentSessionErrors.length > 0) {
      const newErrors = { ...sessionErrors };
      currentSessionErrors.forEach((key) => {
        delete newErrors[key];
      });
      setSessionErrors(newErrors);
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

  const validateClassData = () => {
    const newErrors: Record<string, string> = {};

    // Validate class data
    if (!classData.name.trim()) {
      newErrors.name = "Class name is required";
    }

    if (!classData.instructor.trim()) {
      newErrors.instructor = "Instructor name is required";
    }

    if (classData.duration <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (classData.capacity <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    }

    if (classData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSessionData = () => {
    const newErrors: Record<string, string> = {};

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

    setSessionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClassSubmit = async () => {
    if (!validateClassData()) {
      return;
    }

    try {
      if (initialData) {
        // Update existing class
        const updatedClass = await updateClass.mutateAsync({
          id: initialData.id,
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
        setNewClassId(updatedClass.id);
      } else if (newClassId) {
        await updateClass.mutateAsync({
          id: newClassId,
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
      } else {
        // Create new class
        const newClass = await createClass.mutateAsync({
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
        setNewClassId(newClass.id);
      }

      setStep(2); // Move to session creation
    } catch (error) {
      console.error("Class creation error:", error);
    }
  };

  const handleSessionSubmit = async () => {
    if (!validateSessionData()) {
      return;
    }

    try {
      // Create sessions for the class
      const classId = newClassId || initialData?.id;

      if (!classId) {
        throw new Error("Class ID not found");
      }

      // Process each session
      await Promise.all(
        sessions.map(async (session) => {
          const startDateTime = new Date(
            `${session.start_date}T${session.start_time}`
          );

          await createSession.mutateAsync({
            class_id: classId,
            start_time: startDateTime.toISOString(),
            is_recurring: session.is_recurring,
            recurring_pattern: session.recurrence_options.pattern,
            recurring_end_date: session.recurrence_options.endDate || undefined,
            custom_recurrence:
              session.recurrence_options.pattern === "custom"
                ? session.recurrence_options
                : undefined,
          });
        })
      );

      // Move to completion step
      setStep(3);
    } catch (error) {
      console.error("Session creation error:", error);
    }
  };

  const handleComplete = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleSkipSessions = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const isProcessing =
    createClass.isPending || updateClass.isPending || createSession.isPending;

  // Render different steps of the wizard
  const renderStepOne = () => (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Step 1: Class Details</h3>
          <p className="text-sm text-gray-500">
            Basic information about the class
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="bg-olive-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-1">
            1
          </span>
          <span className="mr-2">of</span>
          <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center">
            3
          </span>
        </div>
      </div>

      <Input
        label="Class Name"
        name="name"
        placeholder="e.g. Reformer Flow"
        value={classData.name}
        onChange={handleClassDataChange}
        error={errors.name}
        required
      />

      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          className="w-full p-2 border border-gray-200 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-olive-200"
          placeholder="Describe the class format, level, and what clients should expect..."
          value={classData.description}
          onChange={handleClassDataChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          name="duration"
          type="number"
          placeholder="e.g. 60"
          value={classData.duration}
          onChange={handleClassDataChange}
          error={errors.duration}
          required
        />

        <Input
          label="Price ($)"
          name="price"
          type="number"
          step="0.01"
          placeholder="e.g. 25"
          value={classData.price}
          onChange={handleClassDataChange}
          error={errors.price}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Instructor"
          name="instructor"
          placeholder="e.g. Emma Wilson"
          value={classData.instructor}
          onChange={handleClassDataChange}
          error={errors.instructor}
          required
        />

        <Input
          label="Capacity"
          name="capacity"
          type="number"
          placeholder="e.g. 10"
          value={classData.capacity}
          onChange={handleClassDataChange}
          error={errors.capacity}
          required
        />
      </div>

      <div className="flex justify-between pt-4 border-t mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="primary"
            onClick={handleClassSubmit}
            isLoading={isProcessing}
            icon={ArrowRight}
          >
            Continue to Scheduling
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Step 2: Schedule Sessions</h3>
          <p className="text-sm text-gray-500">
            {`Add session times for "${classData.name}"`}
          </p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-1">
            2
          </span>
          <span className="mr-2">of</span>
          <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 inline-flex items-center justify-center">
            3
          </span>
        </div>
      </div>

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
              className="p-4 border border-gray-200 rounded-lg relative"
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
                  error={sessionErrors[`session_${session.id}_start_date`]}
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
                  error={sessionErrors[`session_${session.id}_start_time`]}
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
                    label="Recurrence Pattern"
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
                      {sessionErrors[`session_${session.id}_daysOfWeek`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {sessionErrors[`session_${session.id}_daysOfWeek`]}
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

      <div className="flex justify-between pt-4 border-t mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          icon={ArrowLeft}
          disabled={isProcessing}
        >
          Back
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkipSessions}
            disabled={isProcessing}
          >
            Skip Scheduling
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSessionSubmit}
            isLoading={isProcessing}
            icon={ArrowRight}
            disabled={sessions.length === 0}
          >
            Create Sessions
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4 text-center">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Success!</h3>
          <p className="text-sm text-gray-500">Class and sessions created</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <span className="bg-olive-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-1">
            3
          </span>
          <span className="mr-2">of</span>
          <span className="bg-olive-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center">
            3
          </span>
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg mb-6">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-green-800 mb-2">
          {`"${classData.name}" Created Successfully`}
        </h3>
        <p className="text-green-600">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} scheduled
        </p>
      </div>

      <div className="pt-4 border-t mt-6">
        <Button
          type="button"
          variant="primary"
          onClick={handleComplete}
          className="px-8"
        >
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {step === 1 && renderStepOne()}
      {step === 2 && renderStepTwo()}
      {step === 3 && renderStepThree()}
    </div>
  );
};

export default ClassWizard;

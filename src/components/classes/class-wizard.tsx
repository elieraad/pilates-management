"use client";

import { useState, useMemo } from "react";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class, RecurrenceOptions } from "@/types/class.types";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import { Plus, X, Calendar, ArrowRight, ArrowLeft, Check } from "lucide-react";

type ClassWizardProps = {
  initialData?: Class;
  initialDate?: Date;
  onSuccess?: () => void;
};

const formatDateForInput = (date?: Date) => {
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

const defaultRecurrence: RecurrenceOptions = {
  pattern: "weekly",
  endDate: null,
  daysOfWeek: [],
};

const ClassWizard = ({
  initialData,
  initialDate,
  onSuccess,
}: ClassWizardProps) => {
  // steps: 1 = class details, 2 = sessions, 3 = success
  const [step, setStep] = useState<number>(1);
  const [newClassId, setNewClassId] = useState<string | null>(
    initialData ? initialData.id : null
  );

  const {
    useCreateClassMutation,
    useUpdateClassMutation,
    useCreateClassSessionMutation,
  } = useClasses();

  const createClass = useCreateClassMutation();
  const updateClass = useUpdateClassMutation();
  const createSession = useCreateClassSessionMutation();

  // class data state (use strings for inputs to avoid controlled/uncontrolled edge cases)
  const [classData, setClassData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    duration: (initialData?.duration ?? 60) as number,
    capacity: (initialData?.capacity ?? 10) as number,
    price: (initialData?.price ?? 25) as number,
    instructor: initialData?.instructor || "",
  });

  // sessions
  const [sessions, setSessions] = useState<
    {
      id: string;
      start_date: string;
      start_time: string;
      is_recurring: boolean;
      recurrence_options: RecurrenceOptions;
    }[]
  >(() => [
    {
      id: crypto.randomUUID(),
      start_date: formatDateForInput(initialDate) || "",
      start_time: "09:00",
      is_recurring: false,
      recurrence_options: { ...defaultRecurrence },
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>(
    {}
  );

  const isProcessing =
    createClass.isPending || updateClass.isPending || createSession.isPending;

  // ---------- handlers ----------
  const handleClassDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      // ensure numeric fields store numbers
      setClassData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setClassData((prev) => ({ ...prev, [name]: value }));
    }

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
      prev.map((s) => (s.id === sessionId ? { ...s, [field]: value } : s))
    );

    const key = `session_${sessionId}_${field}`;
    if (sessionErrors[key]) {
      setSessionErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleRecurrenceChange = (
    sessionId: string,
    field: keyof RecurrenceOptions,
    value: string | null | string[]
  ) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              recurrence_options: {
                ...s.recurrence_options,
                [field]: value,
              },
            }
          : s
      )
    );
  };

  const addSession = () => {
    setSessions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start_date: prev[0]?.start_date || formatDateForInput(new Date()),
        start_time: "",
        is_recurring: false,
        recurrence_options: { ...defaultRecurrence },
      },
    ]);
  };

  const removeSession = (sessionId: string) => {
    if (sessions.length === 1) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    // clear related errors
    const keysToRemove = Object.keys(sessionErrors).filter((k) =>
      k.startsWith(`session_${sessionId}`)
    );
    if (keysToRemove.length) {
      const next = { ...sessionErrors };
      keysToRemove.forEach((k) => delete next[k]);
      setSessionErrors(next);
    }
  };

  const toggleDayOfWeek = (sessionId: string, day: number) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const days = s.recurrence_options.daysOfWeek || [];
        const nextDays = days.includes(day)
          ? days.filter((d) => d !== day)
          : [...days, day];
        return {
          ...s,
          recurrence_options: { ...s.recurrence_options, daysOfWeek: nextDays },
        };
      })
    );
  };

  // ---------- validation ----------
  const validateClassData = () => {
    const newErrors: Record<string, string> = {};
    if (!String(classData.name).trim())
      newErrors.name = "Class name is required";
    if (!String(classData.instructor).trim())
      newErrors.instructor = "Instructor is required";
    if (!(Number(classData.duration) > 0))
      newErrors.duration = "Duration must be greater than 0";
    if (!(Number(classData.capacity) > 0))
      newErrors.capacity = "Capacity must be greater than 0";
    if (Number(classData.price) < 0)
      newErrors.price = "Price cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSessionData = () => {
    const newErrors: Record<string, string> = {};
    sessions.forEach((s) => {
      if (!s.start_date)
        newErrors[`session_${s.id}_start_date`] = "Date is required";
      if (!s.start_time)
        newErrors[`session_${s.id}_start_time`] = "Time is required";
      if (
        s.is_recurring &&
        s.recurrence_options.pattern === "custom" &&
        (!s.recurrence_options.daysOfWeek ||
          s.recurrence_options.daysOfWeek.length === 0)
      ) {
        newErrors[`session_${s.id}_daysOfWeek`] = "Select at least one day";
      }
    });
    setSessionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- submit handlers ----------
  const handleClassSubmit = async () => {
    if (!validateClassData()) return;

    try {
      if (initialData) {
        const updated = await updateClass.mutateAsync({
          id: initialData.id,
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
        setNewClassId(updated.id);
      } else if (newClassId) {
        await updateClass.mutateAsync({
          id: newClassId,
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
      } else {
        const created = await createClass.mutateAsync({
          ...classData,
          duration: Number(classData.duration),
          capacity: Number(classData.capacity),
          price: Number(classData.price),
        });
        setNewClassId(created.id);
      }

      setStep(2);
    } catch (err) {
      console.error("Class creation error:", err);
    }
  };

  const handleSessionSubmit = async () => {
    if (!validateSessionData()) return;

    try {
      const classId = newClassId || initialData?.id;
      if (!classId) throw new Error("Class ID not found");

      await Promise.all(
        sessions.map(async (s) => {
          const startDateTime = new Date(`${s.start_date}T${s.start_time}`);
          const endDateTime = new Date(
            `${s.recurrence_options.endDate}T${s.start_time}`
          );
          await createSession.mutateAsync({
            class_id: classId,
            start_time: startDateTime.toISOString(),
            is_recurring: s.is_recurring,
            recurring_pattern: s.recurrence_options.pattern,
            recurring_end_date: endDateTime.toISOString() || undefined,
            custom_recurrence:
              s.recurrence_options.pattern === "custom"
                ? s.recurrence_options
                : undefined,
          });
        })
      );

      setStep(3);
    } catch (err) {
      console.error("Session creation error:", err);
    }
  };

  const handleSkipSessions = () => {
    if (onSuccess) onSuccess();
  };

  const handleComplete = () => {
    if (onSuccess) onSuccess();
  };

  // small helper for mobile-friendly progress width
  const progressWidth = useMemo(
    () => `${Math.round((step / 3) * 100)}%`,
    [step]
  );

  // ---------- UI ----------
  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Header + progress */}
      <div className="py-4 px-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 1
                ? "Class Details"
                : step === 2
                ? "Schedule Sessions"
                : "All Set!"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1
                ? "Basic information about the class"
                : step === 2
                ? `Add session times for "${classData.name || "your class"}"`
                : "Class and sessions created successfully"}
            </p>
          </div>

          {/* compact step badge */}
          <div className="hidden md:flex items-center text-sm text-gray-500">
            <div className="w-8 h-8 rounded-full bg-olive-600 text-white flex items-center justify-center mr-2">
              {step}
            </div>
            <div className="text-sm text-gray-500">of 3</div>
          </div>
        </div>

        {/* progress bar */}
        <div className="w-full h-1 bg-gray-200 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-olive-600 transition-all"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <div className="px-4 pb-28 md:pb-0">
        {" "}
        {/* large bottom padding so content isn't obscured by sticky footer */}
        {/* STEP 1 - class details */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <Input
                label="Class Name"
                name="name"
                placeholder="e.g. Reformer Flow"
                value={String(classData.name)}
                onChange={handleClassDataChange}
                error={errors.name}
                required
                className="h-12 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                className="w-full p-3 border rounded-lg h-28 text-sm focus:outline-none focus:ring-2 focus:ring-olive-200"
                placeholder="Describe the class format, level, and what clients should expect..."
                value={String(classData.description)}
                onChange={handleClassDataChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Duration (minutes)"
                name="duration"
                type="number"
                placeholder="e.g. 60"
                value={Number(classData.duration)}
                onChange={handleClassDataChange}
                error={errors.duration}
                required
                className="h-12 text-sm"
              />

              <Input
                label="Price ($)"
                name="price"
                type="number"
                step="0.01"
                placeholder="e.g. 25"
                value={Number(classData.price)}
                onChange={handleClassDataChange}
                error={errors.price}
                required
                className="h-12 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Instructor"
                name="instructor"
                placeholder="e.g. Emma Wilson"
                value={String(classData.instructor)}
                onChange={handleClassDataChange}
                error={errors.instructor}
                required
                className="h-12 text-sm"
              />

              <Input
                label="Capacity"
                name="capacity"
                type="number"
                placeholder="e.g. 10"
                value={Number(classData.capacity)}
                onChange={handleClassDataChange}
                error={errors.capacity}
                required
                className="h-12 text-sm"
              />
            </div>
          </div>
        )}
        {/* STEP 2 - sessions */}
        {step === 2 && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center bg-gray-50 p-6 rounded-lg">
                <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  No Sessions Scheduled
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Add a session time to schedule this class
                </p>
                <Button onClick={addSession} variant="secondary" icon={Plus}>
                  Add Session Time
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-700">
                            Session {idx + 1}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.start_date || "Select date & time"}
                          </div>
                        </div>
                      </div>
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSession(session.id)}
                          className="p-2 rounded-md text-gray-400 hover:text-red-500"
                          aria-label="Remove session"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
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
                        error={
                          sessionErrors[`session_${session.id}_start_date`]
                        }
                        required
                        className="h-12"
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
                        error={
                          sessionErrors[`session_${session.id}_start_time`]
                        }
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        id={`recurring_${session.id}`}
                        type="checkbox"
                        className="h-4 w-4"
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
                        className="text-sm text-gray-700"
                      >
                        Make this a recurring session
                      </label>
                    </div>

                    {session.is_recurring && (
                      <details className="mt-3 border-t pt-3">
                        <summary className="cursor-pointer text-sm font-medium text-olive-700">
                          Recurrence Options
                        </summary>

                        <div className="mt-3 space-y-3">
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
                                {[
                                  "Sun",
                                  "Mon",
                                  "Tue",
                                  "Wed",
                                  "Thu",
                                  "Fri",
                                  "Sat",
                                ].map((day, i) => {
                                  const selected =
                                    session.recurrence_options.daysOfWeek?.includes(
                                      i
                                    );
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() =>
                                        toggleDayOfWeek(session.id, i)
                                      }
                                      className={`py-1.5 px-3 rounded-full text-sm font-medium ${
                                        selected
                                          ? "bg-olive-600 text-white"
                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>
                              {sessionErrors[
                                `session_${session.id}_daysOfWeek`
                              ] && (
                                <p className="mt-2 text-xs text-red-600">
                                  {
                                    sessionErrors[
                                      `session_${session.id}_daysOfWeek`
                                    ]
                                  }
                                </p>
                              )}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center mb-2">
                              <input
                                id={`no_end_date_${session.id}`}
                                type="checkbox"
                                className="h-4 w-4 mr-2"
                                checked={!session.recurrence_options.endDate}
                                onChange={(e) =>
                                  handleRecurrenceChange(
                                    session.id,
                                    "endDate",
                                    e.target.checked
                                      ? null
                                      : formatDateForInput(
                                          new Date(
                                            Date.now() +
                                              30 * 24 * 60 * 60 * 1000
                                          )
                                        )
                                  )
                                }
                              />
                              <label
                                htmlFor={`no_end_date_${session.id}`}
                                className="text-sm text-gray-700"
                              >
                                Recurring indefinitely
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
                      </details>
                    )}
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    onClick={addSession}
                    variant="outline"
                    icon={Plus}
                    className="w-full"
                  >
                    Add Another Session Time
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* STEP 3 - success */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">{`"${classData.name}" Created Successfully`}</h3>
              <p className="text-green-600">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}{" "}
                scheduled
              </p>
            </div>
            <div>
              <Button onClick={handleComplete} className="px-8">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer actions */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t py-3 px-4 z-50 md:static md:border-0">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Back button for step 2 */}
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                icon={ArrowLeft}
                disabled={isProcessing}
                className="flex-1 md:flex-none"
              >
                Back
              </Button>
            )}

            {/* Primary action */}
            {step === 1 && (
              <Button
                type="button"
                variant="primary"
                onClick={handleClassSubmit}
                isLoading={isProcessing}
                icon={ArrowRight}
                className="flex-1 md:flex-none"
              >
                Continue
              </Button>
            )}

            {step === 2 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipSessions}
                  disabled={isProcessing}
                  className="flex-1 md:flex-none"
                >
                  Skip
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSessionSubmit}
                  isLoading={isProcessing}
                  icon={ArrowRight}
                  disabled={sessions.length === 0}
                  className="flex-1 md:flex-none"
                >
                  Create
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassWizard;

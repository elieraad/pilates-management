export interface Class {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  duration: number;
  capacity: number;
  price: number;
  instructor: string;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  studio_id: string;
  start_time: string;
  start_time: string;
  is_recurring: boolean;
  recurring_pattern: string | null;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  class: Class;
  bookings_count?: number;
  is_exception?: boolean;
}

export interface CreateClassInput {
  name: string;
  description?: string;
  duration: number;
  capacity: number;
  price: number;
  instructor: string;
}

export interface CreateClassSessionInput {
  class_id: string;
  start_time: string;
  is_recurring: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  custom_recurrence?: RecurrenceOptions;
}

export interface RecurrenceOptions {
  pattern: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  endDate?: string | null; // null means no end date
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  daysOfMonth?: number[]; // For monthly recurrence with specific days
  interval?: number; // For "every X days/weeks/months"
}

export interface CreateSessionsInput {
  class_id: string;
  sessions: {
    start_date: string;
    start_time: string;
    is_recurring: boolean;
    recurrence_options?: RecurrenceOptions;
  }[];
}

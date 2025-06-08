import { ClassSession } from "./class.types";

export type BookingStatus = "confirmed" | "pending" | "cancelled";

export interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
}
export interface Booking {
  id: string;
  class_session_id: string;
  studio_id: string;
  client: Client;
  status: BookingStatus;
  payment_status: "paid" | "unpaid" | "refunded";
  amount: number;
  session_date: string;
  created_at: string;
  updated_at: string;
}

export interface BookingSession extends Booking {
  class_session: ClassSession;
}

export interface CreateBookingInput {
  class_session_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  status: "confirmed" | "pending" | "cancelled";
  payment_status: "paid" | "unpaid" | "refunded";
  amount: number;
  sessionDate: string;
}

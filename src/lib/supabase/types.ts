export type Database = {
  public: {
    Tables: {
      studios: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          logo_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          phone?: string | null;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          id: string;
          studio_id: string;
          plan_id: string;
          status: string;
          start_date: string;
          end_date: string;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          plan_id: string;
          status: string;
          start_date: string;
          end_date: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          studio_id?: string;
          plan_id?: string;
          status?: string;
          start_date?: string;
          end_date?: string;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          description: string | null;
          capacity: number;
          price: number;
          start_time: string;
          end_time: string;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          recurrence_end_date: string | null;
          parent_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          studio_id: string;
          name: string;
          description?: string | null;
          capacity: number;
          price: number;
          start_time: string;
          end_time: string;
          is_recurring?: boolean;
          recurrence_pattern?: string | null;
          recurrence_end_date?: string | null;
          parent_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          studio_id?: string;
          name?: string;
          description?: string | null;
          capacity?: number;
          price?: number;
          start_time?: string;
          end_time?: string;
          is_recurring?: boolean;
          recurrence_pattern?: string | null;
          recurrence_end_date?: string | null;
          parent_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          session_id: string;
          user_email: string;
          user_name: string;
          status: string;
          payment_status: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_email: string;
          user_name: string;
          status?: string;
          payment_status?: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_email?: string;
          user_name?: string;
          status?: string;
          payment_status?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

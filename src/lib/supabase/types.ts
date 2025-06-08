export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number
          class_session_id: string
          client_id: string
          created_at: string
          id: string
          payment_status: "paid" | "unpaid" | "refunded"
          session_date: string
          status: "confirmed" | "pending" | "cancelled"
          studio_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          class_session_id: string
          client_id: string
          created_at?: string
          id?: string
          payment_status: "paid" | "unpaid" | "refunded"
          session_date: string
          status: "confirmed" | "pending" | "cancelled"
          studio_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          class_session_id?: string
          client_id?: string
          created_at?: string
          id?: string
          payment_status?: "paid" | "unpaid" | "refunded"
          session_date?: string
          status?: "confirmed" | "pending" | "cancelled"
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_id: string
          created_at: string
          custom_recurrence: Json | null
          id: string
          is_cancelled: boolean
          is_recurring: boolean
          recurring_pattern: string | null
          start_time: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          custom_recurrence?: Json | null
          id?: string
          is_cancelled?: boolean
          is_recurring?: boolean
          recurring_pattern?: string | null
          start_time: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          custom_recurrence?: Json | null
          id?: string
          is_cancelled?: boolean
          is_recurring?: boolean
          recurring_pattern?: string | null
          start_time?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          duration: number
          id: string
          instructor: string
          is_cancelled: boolean
          name: string
          price: number
          studio_id: string
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          instructor: string
          is_cancelled?: boolean
          name: string
          price: number
          studio_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          instructor?: string
          is_cancelled?: boolean
          name?: string
          price?: number
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_visit_date: string | null
          name: string
          notes: string | null
          phone: string | null
          studio_id: string
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_visit_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          studio_id: string
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_visit_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          studio_id?: string
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          license_type: string
          payment_reference: string | null
          start_date: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          license_type: string
          payment_reference?: string | null
          start_date?: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          license_type?: string
          payment_reference?: string | null
          start_date?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exceptions: {
        Row: {
          created_at: string
          exception_type: string
          id: string
          modified_start_time: string | null
          start_time: string
          recurring_session_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exception_type: string
          id?: string
          modified_start_time?: string | null
          start_time: string
          recurring_session_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exception_type?: string
          id?: string
          modified_start_time?: string | null
          start_time?: string
          recurring_session_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exceptions_recurring_session_id_fkey"
            columns: ["recurring_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exceptions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string
          created_at: string
          description: string | null
          email: string
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          email: string
          id: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_studio_license: {
        Args: { p_studio_id: string }
        Returns: boolean
      }
      count_session_bookings: {
        Args: { p_session_id: string; p_session_date?: string }
        Returns: number
      }
      create_booking_with_capacity_check: {
        Args: {
          p_class_session_id: string
          p_studio_id: string
          p_client_email: string
          p_client_name: string
          p_session_date: string
          p_client_phone?: string
          p_status?: "confirmed" | "pending" | "cancelled"
          p_payment_status?: "paid" | "unpaid" | "refunded"
          p_amount?: number
        }
        Returns: {
          booking_id: string
          client_id: string
          is_new_client: boolean
        }
      }
      exec_sql: {
        Args: { sql_query: string }
        Returns: string
      }
      get_booking_counts: {
        Args: { studio_id_param: string; date_from_param: string }
        Returns: {
          total_count: number
          confirmed_count: number
          cancelled_count: number
        }[]
      }
      get_booking_stats: {
        Args: { studio_id_param: string; date_from_param: string }
        Returns: {
          total_count: number
          confirmed_count: number
          cancelled_count: number
        }
      }
      get_client_with_bookings: {
        Args: { p_studio_id: string; p_client_id: string }
        Returns: {
          client_info: Json
          recent_bookings: Json
        }[]
      }
      migrate_bookings_to_clients: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

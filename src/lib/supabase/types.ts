export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number
          class_session_id: string
          client_id: string
          created_at: string
          id: string
          payment_status: string
          session_date: string
          status: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          class_session_id: string
          client_id: string
          created_at?: string
          id?: string
          payment_status: string
          session_date: string
          status: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          class_session_id?: string
          client_id?: string
          created_at?: string
          id?: string
          payment_status?: string
          session_date?: string
          status?: string
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
          recurring_end_date: string | null
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
          recurring_end_date?: string | null
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
          recurring_end_date?: string | null
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
          original_date: string
          recurring_session_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exception_type: string
          id?: string
          modified_start_time?: string | null
          original_date: string
          recurring_session_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exception_type?: string
          id?: string
          modified_start_time?: string | null
          original_date?: string
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
      check_studio_license: { Args: { p_studio_id: string }; Returns: boolean }
      count_session_bookings: {
        Args: { p_session_date?: string; p_session_id: string }
        Returns: number
      }
      create_booking_with_capacity_check:
        | {
            Args: {
              p_amount?: number
              p_class_session_id: string
              p_client_email: string
              p_client_name: string
              p_client_phone?: string
              p_payment_status?: string
              p_session_date: string
              p_status?: string
              p_studio_id: string
            }
            Returns: {
              booking_id: string
              client_id: string
              is_new_client: boolean
            }[]
          }
      get_booking_stats: {
        Args: { date_from_param: string; studio_id_param: string }
        Returns: Database["public"]["CompositeTypes"]["booking_stats"]
        SetofOptions: {
          from: "*"
          to: "booking_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_client_with_bookings: {
        Args: { p_client_id: string; p_studio_id: string }
        Returns: {
          client_info: Json
          recent_bookings: Json
        }[]
      }
      migrate_bookings_to_clients: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      booking_stats: {
        total_count: number | null
        confirmed_count: number | null
        cancelled_count: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


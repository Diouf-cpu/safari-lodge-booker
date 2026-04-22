export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_groups: {
        Row: {
          booker_type: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          expires_at: string | null
          expiry_warning_sent: boolean
          grand_total: number
          id: string
          member_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          voucher_no: string
        }
        Insert: {
          booker_type?: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at?: string
          expires_at?: string | null
          expiry_warning_sent?: boolean
          grand_total?: number
          id?: string
          member_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          voucher_no: string
        }
        Update: {
          booker_type?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          expires_at?: string | null
          expiry_warning_sent?: boolean
          grand_total?: number
          id?: string
          member_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          voucher_no?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          arrival_date: string
          booking_type: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          departure_date: string
          group_id: string
          guest_count: number | null
          id: string
          id_number: string | null
          nationality: string | null
          nights: number
          park_id: string
          park_name: string
          per_person_rate: number | null
          rate_per_night: number
          site_id: string
          site_name: string
          site_voucher_no: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          voucher_no: string
        }
        Insert: {
          arrival_date: string
          booking_type?: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at?: string
          departure_date: string
          group_id: string
          guest_count?: number | null
          id?: string
          id_number?: string | null
          nationality?: string | null
          nights: number
          park_id: string
          park_name: string
          per_person_rate?: number | null
          rate_per_night: number
          site_id: string
          site_name: string
          site_voucher_no?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          voucher_no: string
        }
        Update: {
          arrival_date?: string
          booking_type?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          departure_date?: string
          group_id?: string
          guest_count?: number | null
          id?: string
          id_number?: string | null
          nationality?: string | null
          nights?: number
          park_id?: string
          park_name?: string
          per_person_rate?: number | null
          rate_per_night?: number
          site_id?: string
          site_name?: string
          site_voucher_no?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "booking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          subscription_end: string
          subscription_start: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          subscription_end: string
          subscription_start?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          subscription_end?: string
          subscription_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          related_kind: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          related_kind?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          related_kind?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_requests: {
        Row: {
          arrival_date: string
          booking_id: string | null
          created_at: string
          departure_date: string
          id: string
          message: string | null
          park_id: string
          park_name: string
          request_type: string
          requester_email: string
          requester_name: string
          requester_phone: string
          site_id: string
          site_name: string
          staff_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arrival_date: string
          booking_id?: string | null
          created_at?: string
          departure_date: string
          id?: string
          message?: string | null
          park_id: string
          park_name: string
          request_type?: string
          requester_email: string
          requester_name: string
          requester_phone: string
          site_id: string
          site_name: string
          staff_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          arrival_date?: string
          booking_id?: string | null
          created_at?: string
          departure_date?: string
          id?: string
          message?: string | null
          park_id?: string
          park_name?: string
          request_type?: string
          requester_email?: string
          requester_name?: string
          requester_phone?: string
          site_id?: string
          site_name?: string
          staff_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      member_current_status: {
        Args: { _subscription_end: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "accountant" | "manager"
      booking_status: "pending" | "confirmed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
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
  public: {
    Enums: {
      app_role: ["admin", "user", "accountant", "manager"],
      booking_status: ["pending", "confirmed", "cancelled"],
    },
  },
} as const

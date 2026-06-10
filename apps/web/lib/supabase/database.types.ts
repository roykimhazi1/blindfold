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
      booking_passengers: {
        Row: {
          booking_id: string
          created_at: string
          date_of_birth: string
          family_name: string
          gender: string
          given_name: string
          id: string
          nationality: string
          passenger_type: string
          passport_expiry: string
          passport_issuing_country: string
          passport_number: string
          source_traveller_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          date_of_birth: string
          family_name: string
          gender: string
          given_name: string
          id?: string
          nationality: string
          passenger_type: string
          passport_expiry: string
          passport_issuing_country: string
          passport_number: string
          source_traveller_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          date_of_birth?: string
          family_name?: string
          gender?: string
          given_name?: string
          id?: string
          nationality?: string
          passenger_type?: string
          passport_expiry?: string
          passport_issuing_country?: string
          passport_number?: string
          source_traveller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_passengers_source_traveller_id_fkey"
            columns: ["source_traveller_id"]
            isOneToOne: false
            referencedRelation: "travellers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_secrets: {
        Row: {
          airport: string
          attractions: Json
          board: string
          booking_id: string
          carrier: string
          city: string
          country: string
          flight_hours: number
          hotel_name: string
          hotel_stars: number
          outbound_depart_iso: string
          region: string
          transfer_eta_minutes: number
          transfer_partner_id: string
        }
        Insert: {
          airport: string
          attractions?: Json
          board: string
          booking_id: string
          carrier: string
          city: string
          country: string
          flight_hours: number
          hotel_name: string
          hotel_stars: number
          outbound_depart_iso: string
          region: string
          transfer_eta_minutes: number
          transfer_partner_id: string
        }
        Update: {
          airport?: string
          attractions?: Json
          board?: string
          booking_id?: string
          carrier?: string
          city?: string
          country?: string
          flight_hours?: number
          hotel_name?: string
          hotel_stars?: number
          outbound_depart_iso?: string
          region?: string
          transfer_eta_minutes?: number
          transfer_partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_secrets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          breakdown_eur: Json
          cancelled_at_iso: string | null
          contact_email: string
          contact_name: string
          created_at_iso: string
          currency: string
          demo_stage: string
          departure_iso: string
          hints: Json
          id: string
          includes: Json
          inserted_at: string
          nights: number
          price_total: number
          refunded: number | null
          schedule: Json
          status: string
          stripe_payment_intent_id: string | null
          supplier_refs: Json | null
          travelers: number
          user_id: string
        }
        Insert: {
          breakdown_eur: Json
          cancelled_at_iso?: string | null
          contact_email: string
          contact_name: string
          created_at_iso: string
          currency: string
          demo_stage?: string
          departure_iso: string
          hints: Json
          id: string
          includes?: Json
          inserted_at?: string
          nights: number
          price_total: number
          refunded?: number | null
          schedule: Json
          status?: string
          stripe_payment_intent_id?: string | null
          supplier_refs?: Json | null
          travelers: number
          user_id: string
        }
        Update: {
          breakdown_eur?: Json
          cancelled_at_iso?: string | null
          contact_email?: string
          contact_name?: string
          created_at_iso?: string
          currency?: string
          demo_stage?: string
          departure_iso?: string
          hints?: Json
          id?: string
          includes?: Json
          inserted_at?: string
          nights?: number
          price_total?: number
          refunded?: number | null
          schedule?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          supplier_refs?: Json | null
          travelers?: number
          user_id?: string
        }
        Relationships: []
      }
      outbox: {
        Row: {
          body: string
          booking_id: string | null
          created_at_iso: string
          id: string
          inserted_at: string
          kind: string
          scheduled_for_iso: string
          status: string
          subject: string
          to: string
          user_id: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at_iso: string
          id: string
          inserted_at?: string
          kind: string
          scheduled_for_iso: string
          status: string
          subject: string
          to: string
          user_id?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at_iso?: string
          id?: string
          inserted_at?: string
          kind?: string
          scheduled_for_iso?: string
          status?: string
          subject?: string
          to?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          citizen_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
        }
        Insert: {
          citizen_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          citizen_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      travellers: {
        Row: {
          citizen_id: string | null
          created_at: string
          date_of_birth: string
          family_name: string
          gender: string
          given_name: string
          id: string
          is_self: boolean
          nationality: string
          passport_expiry: string
          passport_issuing_country: string
          passport_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          citizen_id?: string | null
          created_at?: string
          date_of_birth: string
          family_name: string
          gender: string
          given_name: string
          id?: string
          is_self?: boolean
          nationality: string
          passport_expiry: string
          passport_issuing_country: string
          passport_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          citizen_id?: string | null
          created_at?: string
          date_of_birth?: string
          family_name?: string
          gender?: string
          given_name?: string
          id?: string
          is_self?: boolean
          nationality?: string
          passport_expiry?: string
          passport_issuing_country?: string
          passport_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
